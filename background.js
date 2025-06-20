// Background service worker for LeetCode Problem Fetcher

// LeetCode GraphQL endpoint
const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

// GraphQL query to fetch all problems
const PROBLEMS_QUERY = `
  query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      total: totalNum
      questions: data {
        acRate
        difficulty
        freqBar
        frontendQuestionId: questionFrontendId
        isFavor
        paidOnly: isPaidOnly
        status
        title
        titleSlug
        content
        topicTags {
          name
          id
          slug
        }
        hasSolution
        hasVideoSolution
      }
    }
  }
`;

// GraphQL query to fetch submissions for a problem
const SUBMISSIONS_QUERY = `
  query submissionList($offset: Int!, $limit: Int!, $lastKey: String, $questionSlug: String!, $lang: Int, $status: Int) {
    questionSubmissionList(
      offset: $offset
      limit: $limit
      lastKey: $lastKey
      questionSlug: $questionSlug
      lang: $lang
      status: $status
    ) {
      lastKey
      hasNext
      submissions {
        id
        title
        titleSlug
        status
        statusDisplay
        lang
        langName
        runtime
        timestamp
        url
        isPending
        memory
        hasNotes
        notes
        flagType
        frontendId
        topicTags {
          id
        }
      }
    }
  }
`;

// GraphQL query to fetch submission details
const SUBMISSION_DETAILS_QUERY = `
  query submissionDetails($submissionId: Int!) {
    submissionDetails(submissionId: $submissionId) {
      runtime
      runtimeDisplay
      runtimePercentile
      runtimeDistribution
      memory
      memoryDisplay
      memoryPercentile
      memoryDistribution
      code
      timestamp
      statusCode
      user {
        username
        profile {
          realName
          userAvatar
        }
      }
      lang {
        name
        verboseName
      }
      question {
        questionId
        titleSlug
        hasFrontendPreview
      }
      notes
      flagType
      topicTags {
        tagId
        slug
        name
      }
      runtimeError
      compileError
      lastTestcase
      codeOutput
      expectedOutput
      totalCorrect
      totalTestcases
      fullCodeOutput
      testDescriptions
      testBodies
      testInfo
      stdOutput
    }
  }
`;

// Function to fetch problems from LeetCode GraphQL API with pagination
async function fetchLeetCodeProblems(progressCallback = null) {
  try {
    console.log('Fetching LeetCode problems...');
    
    let allProblems = [];
    let skip = 0;
    const limit = 50; // Reduced from 100 to 50 for better rate limiting
    let totalProblems = null;
    
    // First, get the total number of problems
    const initialResponse = await fetch(LEETCODE_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: JSON.stringify({
        query: PROBLEMS_QUERY,
        variables: {
          categorySlug: "",
          limit: limit, // Just get the total count
          skip: 0,
          filters: {}
        }
      })
    });

    if (!initialResponse.ok) {
      throw new Error(`HTTP error! status: ${initialResponse.status}`);
    }

    const initialData = await initialResponse.json();
    
    if (initialData.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(initialData.errors)}`);
    }

    totalProblems = initialData.data.problemsetQuestionList.total;
    console.log(`Total problems available: ${totalProblems}`);
    
    // Calculate total number of requests needed
    const totalRequests = Math.ceil(totalProblems / limit);
    let currentRequest = 0;
    
    // Now fetch all problems using pagination
    while (skip < totalProblems) {
      currentRequest++;
      console.log(`Fetching problems ${skip + 1} to ${Math.min(skip + limit, totalProblems)}... (${currentRequest}/${totalRequests})`);
      
      // Report progress
      if (progressCallback) {
        const progress = Math.round((currentRequest / totalRequests) * 100);
        progressCallback(progress, currentRequest, totalRequests, skip + 1, Math.min(skip + limit, totalProblems));
      }
      
      const response = await fetch(LEETCODE_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        body: JSON.stringify({
          query: PROBLEMS_QUERY,
          variables: {
            categorySlug: "",
            limit: limit,
            skip: skip,
            filters: {}
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      const problems = data.data.problemsetQuestionList.questions;
      allProblems = allProblems.concat(problems);
      
      skip += limit;
      
      // Enhanced rate limiting: longer delay between requests
      if (skip < totalProblems) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Increased from 100ms to 200ms
      }
    }

    console.log(`Successfully fetched ${allProblems.length} problems out of ${totalProblems} total`);
    
    return allProblems;
  } catch (error) {
    console.error('Error fetching LeetCode problems:', error);
    throw error;
  }
}

// Function to cache problems in local storage
async function cacheProblems(problems) {
  try {
    await chrome.storage.local.set({
      leetcodeProblems: problems,
      lastFetchTime: Date.now()
    });
    console.log('Problems cached successfully');
  } catch (error) {
    console.error('Error caching problems:', error);
  }
}

// Function to get cached problems
async function getCachedProblems() {
  try {
    const result = await chrome.storage.local.get(['leetcodeProblems', 'lastFetchTime']);
    return result.leetcodeProblems || null;
  } catch (error) {
    console.error('Error getting cached problems:', error);
    return null;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clearCache') {
    chrome.storage.local.remove(['leetcodeProblems', 'lastFetchTime'])
      .then(() => {
        sendResponse({
          success: true
        });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });
    return true; // Indicates async response
  }
  
  if (request.action === 'getCachedProblems') {
    getCachedProblems()
      .then(problems => {
        sendResponse({
          success: true,
          problems: problems
        });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });
    return true; // Indicates async response
  }

  if (request.action === 'fetchLatestSubmission') {
    handleFetchLatestSubmission(request.questionSlug, request.forceRefresh)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });
    return true; // Indicates async response
  }

  if (request.action === 'fetchSubmissionDetails') {
    fetchSubmissionDetails(request.submissionId)
      .then(details => {
        sendResponse({
          success: true,
          details: details
        });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });
    return true; // Indicates async response
  }

  if (request.action === 'exportProblemsWithSubmissions') {
    console.log('Received exportProblemsWithSubmissions request');
    
    // Add a timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.error('Export request timed out');
      sendResponse({
        success: false,
        error: 'Export request timed out'
      });
    }, 30000); // 30 second timeout
    
    handleExportProblemsWithSubmissions()
      .then(result => {
        clearTimeout(timeout);
        console.log('Export result:', result);
        sendResponse(result);
      })
      .catch(error => {
        clearTimeout(timeout);
        console.error('Export error:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      });
    return true; // Indicates async response
  }

  // Default case - unknown action
  console.warn('Unknown action:', request.action);
  sendResponse({
    success: false,
    error: `Unknown action: ${request.action}`
  });
  return false; // No async response
});

// Listen for port connections for progress reporting
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'fetchProgress') {
    port.onMessage.addListener(async (msg) => {
      if (msg.action === 'fetchLeetCodeProblems') {
        try {
          const result = await handleFetchProblems(msg.forceRefresh, (progress, currentRequest, totalRequests, start, end) => {
            port.postMessage({
              type: 'progress',
              progress,
              currentRequest,
              totalRequests,
              start,
              end
            });
          });
          port.postMessage({ type: 'complete', result });
        } catch (error) {
          port.postMessage({ type: 'error', error: error.message });
        }
      }
    });
  }
});

// Handle fetching problems with caching
async function handleFetchProblems(forceRefresh = false, progressCallback = null) {
  try {
    // If force refresh is requested, skip cache check
    if (!forceRefresh) {
      // First try to get cached problems
      const cachedProblems = await getCachedProblems();
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      
      if (cachedProblems && (now - (await chrome.storage.local.get(['lastFetchTime'])).lastFetchTime < oneHour)) {
        console.log('Using cached problems');
        return {
          success: true,
          problems: cachedProblems,
          cached: true
        };
      }
    } else {
      console.log('Force refresh requested - bypassing cache');
    }
    
    // Fetch fresh problems from API
    const problems = await fetchLeetCodeProblems(progressCallback);
    
    // Cache the problems
    await cacheProblems(problems);
    
    return {
      success: true,
      problems: problems,
      cached: false
    };
  } catch (error) {
    console.error('Error in handleFetchProblems:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Handle fetching the latest accepted submission with caching
async function handleFetchLatestSubmission(questionSlug, forceRefresh = false) {
  try {
    // If force refresh is requested, skip cache check
    if (!forceRefresh) {
      // First try to get cached latest submission
      const cachedSubmission = await getCachedLatestSubmission(questionSlug);
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
      
      if (cachedSubmission) {
        const key = `latest_submission_${questionSlug}_timestamp`;
        const result = await chrome.storage.local.get([key]);
        const lastFetchTime = result[key];
        
        if (lastFetchTime && (now - lastFetchTime < thirtyMinutes)) {
          console.log(`Using cached latest submission for ${questionSlug}`);
          return {
            success: true,
            submission: cachedSubmission,
            cached: true
          };
        }
      }
    } else {
      console.log(`Force refresh requested for latest submission - bypassing cache`);
    }
    
    // Fetch fresh latest submission from API
    const submission = await fetchLatestAcceptedSubmission(questionSlug);
    
    // Cache the submission
    await cacheLatestSubmission(questionSlug, submission);
    
    return {
      success: true,
      submission: submission,
      cached: false
    };
  } catch (error) {
    console.error('Error in handleFetchLatestSubmission:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Install event listener
chrome.runtime.onInstalled.addListener(() => {
  console.log('LeetCode Problem Fetcher extension installed');
});

// Function to fetch the latest accepted submission for a specific problem
async function fetchLatestAcceptedSubmission(questionSlug) {
  try {
    console.log(`Fetching latest accepted submission for problem: ${questionSlug}`);
    
    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: JSON.stringify({
        query: SUBMISSIONS_QUERY,
        variables: {
          questionSlug: questionSlug,
          offset: 0,
          limit: 1, // Only get the latest submission
          lastKey: null,
          status: 10 // 10 = Accepted submissions
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const submissions = data.data.questionSubmissionList.submissions;
    const latestSubmission = submissions.length > 0 ? submissions[0] : null;
    
    if (latestSubmission) {
      console.log(`Successfully fetched latest accepted submission for ${questionSlug}`);
    } else {
      console.log(`No accepted submissions found for ${questionSlug}`);
    }
    
    return latestSubmission;
  } catch (error) {
    console.error('Error fetching latest accepted submission:', error);
    throw error;
  }
}

// Function to fetch submission details
async function fetchSubmissionDetails(submissionId) {
  try {
    console.log(`Fetching submission details for ID: ${submissionId}`);
    
    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: JSON.stringify({
        query: SUBMISSION_DETAILS_QUERY,
        variables: {
          submissionId: parseInt(submissionId)
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const submissionDetails = data.data.submissionDetails;
    console.log(`Successfully fetched submission details for ID: ${submissionId}`);
    
    return submissionDetails;
  } catch (error) {
    console.error('Error fetching submission details:', error);
    throw error;
  }
}

// Function to cache the latest accepted submission in local storage
async function cacheLatestSubmission(questionSlug, submission) {
  try {
    const key = `latest_submission_${questionSlug}`;
    await chrome.storage.local.set({
      [key]: submission,
      [`${key}_timestamp`]: Date.now()
    });
    console.log(`Latest submission cached successfully for ${questionSlug}`);
  } catch (error) {
    console.error('Error caching latest submission:', error);
  }
}

// Function to get cached latest submission
async function getCachedLatestSubmission(questionSlug) {
  try {
    const key = `latest_submission_${questionSlug}`;
    const result = await chrome.storage.local.get([key, `${key}_timestamp`]);
    return result[key] || null;
  } catch (error) {
    console.error('Error getting cached latest submission:', error);
    return null;
  }
}

// Handle exporting problems with their latest submissions
async function handleExportProblemsWithSubmissions() {
  try {
    console.log('handleExportProblemsWithSubmissions called');
    
    // Get cached problems
    const cachedProblems = await getCachedProblems();
    if (!cachedProblems || cachedProblems.length === 0) {
      console.log('No cached problems found');
      return {
        success: false,
        error: 'No problems found. Please fetch problems first.'
      };
    }

    console.log(`Found ${cachedProblems.length} cached problems`);
    
    // Process problems and get their latest submissions with details
    const problemsWithSubmissions = [];
    let submissionsFound = 0;
    
    for (let i = 0; i < cachedProblems.length; i++) {
      const problem = cachedProblems[i];
      
      try {
        // Try to get cached submission first
        const cachedSubmission = await getCachedLatestSubmission(problem.titleSlug);
        
        if (cachedSubmission) {
          // Fetch submission details (including code) for this submission
          console.log(`Fetching submission details for ${problem.titleSlug} (ID: ${cachedSubmission.id})`);
          
          try {
            const submissionDetails = await fetchSubmissionDetails(cachedSubmission.id);
            
            // Combine submission info with details
            const submissionWithDetails = {
              ...cachedSubmission,
              ...submissionDetails
            };
            
            problemsWithSubmissions.push({
              ...problem,
              latestSubmission: submissionWithDetails
            });
            submissionsFound++;
            console.log(`Successfully fetched submission details for ${problem.titleSlug}`);
            
            // Rate limiting to avoid overwhelming the API
            if (i < cachedProblems.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            
          } catch (detailsError) {
            console.error(`Error fetching submission details for ${problem.titleSlug}:`, detailsError);
            // Use submission without details if details fetch fails
            problemsWithSubmissions.push({
              ...problem,
              latestSubmission: cachedSubmission
            });
            submissionsFound++;
          }
        } else {
          // No cached submission found
          problemsWithSubmissions.push({
            ...problem,
            latestSubmission: null
          });
          console.log(`No cached submission for ${problem.titleSlug}`);
        }
        
      } catch (error) {
        console.error(`Error getting submission for ${problem.titleSlug}:`, error);
        // Add problem without submission if there's an error
        problemsWithSubmissions.push({
          ...problem,
          latestSubmission: null
        });
      }
    }
    
    console.log(`Export completed: ${problemsWithSubmissions.length} problems, ${submissionsFound} submissions found`);
    
    // Create export data with metadata
    const exportData = {
      problems: problemsWithSubmissions,
      exportInfo: {
        totalProblems: problemsWithSubmissions.length,
        submissionsFound: submissionsFound,
        exportDate: new Date().toISOString(),
        version: "1.0"
      }
    };
    
    const result = {
      success: true,
      data: exportData,
      totalProblems: problemsWithSubmissions.length,
      submissionsFound: submissionsFound
    };
    
    console.log('Returning result:', result);
    return result;
    
  } catch (error) {
    console.error('Error in handleExportProblemsWithSubmissions:', error);
    return {
      success: false,
      error: error.message
    };
  }
} 