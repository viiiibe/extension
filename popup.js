document.addEventListener('DOMContentLoaded', function() {
  const fetchButton = document.getElementById('fetchProblems');
  const clearCacheButton = document.getElementById('clearCache');
  const exportButton = document.getElementById('exportProblems');
  const statusDiv = document.getElementById('status');
  const resultsDiv = document.getElementById('results');
  const progressContainer = document.getElementById('progressContainer');
  const progressText = document.getElementById('progressText');
  const progressPercent = document.getElementById('progressPercent');
  const progressBar = document.getElementById('progressBar');
  const progressDetails = document.getElementById('progressDetails');

  function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
  }

  function hideStatus() {
    statusDiv.style.display = 'none';
  }

  function showResults() {
    resultsDiv.style.display = 'block';
  }

  function hideResults() {
    resultsDiv.style.display = 'none';
  }

  function showProgress() {
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    progressText.textContent = 'Fetching problems...';
    progressDetails.textContent = 'Request 1 of 1';
  }

  function hideProgress() {
    progressContainer.style.display = 'none';
  }

  function updateProgress(progress, currentRequest, totalRequests, start, end) {
    progressBar.style.width = `${progress}%`;
    progressPercent.textContent = `${progress}%`;
    progressText.textContent = `Fetching problems ${start}-${end}...`;
    progressDetails.textContent = `Request ${currentRequest} of ${totalRequests}`;
  }

  function getStatusText(status) {
    switch (status) {
      case 'ac':
        return 'Solved';
      case 'notac':
        return 'Attempted';
      default:
        return 'Unsolved';
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case 'ac':
        return 'status-solved';
      case 'notac':
        return 'status-attempted';
      default:
        return 'status-unsolved';
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      // You could show a brief "Copied!" message here if desired
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  function createProblemDetails(problem) {
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'problem-details';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'details-header';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'details-title';
    titleDiv.textContent = 'Problem Details';
    
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy JSON';
    copyButton.addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(JSON.stringify(problem, null, 2));
    });
    
    headerDiv.appendChild(titleDiv);
    headerDiv.appendChild(copyButton);
    
    const jsonDiv = document.createElement('div');
    jsonDiv.className = 'json-display';
    jsonDiv.textContent = JSON.stringify(problem, null, 2);
    
    detailsDiv.appendChild(headerDiv);
    detailsDiv.appendChild(jsonDiv);
    
    // Add description section if content is available
    if (problem.content) {
      const descriptionSection = document.createElement('div');
      descriptionSection.style.marginTop = '12px';
      descriptionSection.style.padding = '12px';
      descriptionSection.style.background = '#f8f9fa';
      descriptionSection.style.borderRadius = '4px';
      descriptionSection.style.border = '1px solid #dee2e6';
      
      const descriptionHeader = document.createElement('div');
      descriptionHeader.style.display = 'flex';
      descriptionHeader.style.justifyContent = 'space-between';
      descriptionHeader.style.alignItems = 'center';
      descriptionHeader.style.marginBottom = '8px';
      
      const descriptionTitle = document.createElement('div');
      descriptionTitle.style.fontWeight = '600';
      descriptionTitle.style.color = '#1a1a1a';
      descriptionTitle.style.fontSize = '14px';
      descriptionTitle.textContent = 'Problem Description';
      
      const copyDescriptionButton = document.createElement('button');
      copyDescriptionButton.className = 'copy-button';
      copyDescriptionButton.textContent = 'Copy Description';
      copyDescriptionButton.addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(problem.content || 'No description available');
      });
      
      descriptionHeader.appendChild(descriptionTitle);
      descriptionHeader.appendChild(copyDescriptionButton);
      
      const descriptionContent = document.createElement('div');
      descriptionContent.style.background = '#ffffff';
      descriptionContent.style.padding = '12px';
      descriptionContent.style.borderRadius = '4px';
      descriptionContent.style.border = '1px solid #dee2e6';
      descriptionContent.style.maxHeight = '300px';
      descriptionContent.style.overflowY = 'auto';
      descriptionContent.style.fontSize = '12px';
      descriptionContent.style.lineHeight = '1.4';
      
      // Convert HTML content to plain text for better display
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = problem.content;
      descriptionContent.textContent = tempDiv.textContent || tempDiv.innerText || problem.content;
      
      descriptionSection.appendChild(descriptionHeader);
      descriptionSection.appendChild(descriptionContent);
      
      descriptionSection.classList.add('description-section');
      detailsDiv.appendChild(descriptionSection);
    }
    
    return detailsDiv;
  }

  function createSubmissionSection(problem) {
    const submissionSection = document.createElement('div');
    submissionSection.className = 'submission-section';
    submissionSection.style.marginTop = '12px';
    submissionSection.style.padding = '12px';
    submissionSection.style.background = '#f8f9fa';
    submissionSection.style.borderRadius = '4px';
    submissionSection.style.border = '1px solid #dee2e6';
    
    const submissionHeader = document.createElement('div');
    submissionHeader.style.display = 'flex';
    submissionHeader.style.justifyContent = 'space-between';
    submissionHeader.style.alignItems = 'center';
    submissionHeader.style.marginBottom = '8px';
    
    const submissionTitle = document.createElement('div');
    submissionTitle.style.fontWeight = '600';
    submissionTitle.style.color = '#1a1a1a';
    submissionTitle.style.fontSize = '14px';
    submissionTitle.textContent = 'Latest Accepted Submission';
    
    const fetchSubmissionsButton = document.createElement('button');
    fetchSubmissionsButton.className = 'fetch-submissions-button';
    fetchSubmissionsButton.textContent = 'Fetch Latest';
    fetchSubmissionsButton.style.padding = '6px 12px';
    fetchSubmissionsButton.style.fontSize = '12px';
    fetchSubmissionsButton.style.background = '#007bff';
    fetchSubmissionsButton.style.color = 'white';
    fetchSubmissionsButton.style.border = 'none';
    fetchSubmissionsButton.style.borderRadius = '4px';
    fetchSubmissionsButton.style.cursor = 'pointer';
    
    fetchSubmissionsButton.addEventListener('click', async (e) => {
      e.stopPropagation();
      await fetchLatestSubmission(problem.titleSlug, submissionSection);
    });
    
    submissionHeader.appendChild(submissionTitle);
    submissionHeader.appendChild(fetchSubmissionsButton);
    
    const submissionsContent = document.createElement('div');
    submissionsContent.className = 'submissions-content';
    submissionsContent.style.background = '#ffffff';
    submissionsContent.style.padding = '12px';
    submissionsContent.style.borderRadius = '4px';
    submissionsContent.style.border = '1px solid #dee2e6';
    submissionsContent.style.maxHeight = '300px';
    submissionsContent.style.overflowY = 'auto';
    submissionsContent.style.fontSize = '12px';
    submissionsContent.style.lineHeight = '1.4';
    submissionsContent.textContent = 'Click "Fetch Latest" to load the latest accepted submission.';
    
    submissionSection.appendChild(submissionHeader);
    submissionSection.appendChild(submissionsContent);
    
    return submissionSection;
  }

  async function fetchLatestSubmission(questionSlug, submissionSection) {
    const fetchButton = submissionSection.querySelector('.fetch-submissions-button');
    const submissionsContent = submissionSection.querySelector('.submissions-content');
    
    try {
      fetchButton.disabled = true;
      fetchButton.textContent = 'Fetching...';
      submissionsContent.textContent = 'Fetching submission...';
      
      const response = await chrome.runtime.sendMessage({
        action: 'fetchLatestSubmission',
        questionSlug: questionSlug
      });
      
      if (response.success) {
        const cacheStatus = response.cached ? ' (cached)' : ' (fresh)';
        displaySubmissionDetails(response.submission, submissionsContent);
        fetchButton.textContent = `Fetched${cacheStatus}`;
      } else {
        throw new Error(response.error || 'Failed to fetch submission');
      }
    } catch (error) {
      submissionsContent.textContent = `Error: ${error.message}`;
      fetchButton.textContent = 'Retry';
    } finally {
      fetchButton.disabled = false;
    }
  }

  function displaySubmissionDetails(submission, container) {
    // Clear the container first
    container.innerHTML = '';
    
    if (!submission) {
      container.innerHTML = '<div style="color: #6c757d; text-align: center; padding: 20px;">No accepted submission found for this problem.</div>';
      return;
    }
    
    // Create submission info section
    const submissionInfo = document.createElement('div');
    submissionInfo.style.padding = '8px';
    submissionInfo.style.marginBottom = '8px';
    submissionInfo.style.border = '1px solid #dee2e6';
    submissionInfo.style.borderRadius = '4px';
    submissionInfo.style.background = '#f8f9fa';
    
    const infoHeader = document.createElement('div');
    infoHeader.style.display = 'flex';
    infoHeader.style.justifyContent = 'space-between';
    infoHeader.style.alignItems = 'center';
    infoHeader.style.marginBottom = '4px';
    
    const infoText = document.createElement('div');
    infoText.style.fontWeight = '500';
    infoText.style.fontSize = '11px';
    infoText.textContent = `${submission.langName} - ${submission.runtime} - ${submission.memory}`;
    
    const viewDetailsButton = document.createElement('button');
    viewDetailsButton.textContent = 'View Code';
    viewDetailsButton.style.padding = '4px 8px';
    viewDetailsButton.style.fontSize = '10px';
    viewDetailsButton.style.background = '#28a745';
    viewDetailsButton.style.color = 'white';
    viewDetailsButton.style.border = 'none';
    viewDetailsButton.style.borderRadius = '3px';
    viewDetailsButton.style.cursor = 'pointer';
    
    viewDetailsButton.addEventListener('click', async (e) => {
      e.stopPropagation();
      await fetchSubmissionDetails(submission.id, container);
    });
    
    infoHeader.appendChild(infoText);
    infoHeader.appendChild(viewDetailsButton);
    
    const submissionMeta = document.createElement('div');
    submissionMeta.style.fontSize = '10px';
    submissionMeta.style.color = '#6c757d';
    submissionMeta.textContent = `Submitted: ${new Date(submission.timestamp * 1000).toLocaleString()}`;
    
    submissionInfo.appendChild(infoHeader);
    submissionInfo.appendChild(submissionMeta);
    container.appendChild(submissionInfo);
  }

  async function fetchSubmissionDetails(submissionId, container) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'fetchSubmissionDetails',
        submissionId: submissionId
      });
      
      if (response.success) {
        displaySubmissionCode(response.details, container);
      } else {
        throw new Error(response.error || 'Failed to fetch submission details');
      }
    } catch (error) {
      console.error('Error fetching submission details:', error);
      alert(`Error fetching submission details: ${error.message}`);
    }
  }

  function displaySubmissionCode(details, container) {
    // Remove existing code section if any
    const existingCode = container.querySelector('.submission-code');
    if (existingCode) {
      existingCode.remove();
    }
    
    const codeSection = document.createElement('div');
    codeSection.className = 'submission-code';
    codeSection.style.marginTop = '8px';
    codeSection.style.padding = '8px';
    codeSection.style.background = '#ffffff';
    codeSection.style.border = '1px solid #dee2e6';
    codeSection.style.borderRadius = '4px';
    
    const codeHeader = document.createElement('div');
    codeHeader.style.display = 'flex';
    codeHeader.style.justifyContent = 'space-between';
    codeHeader.style.alignItems = 'center';
    codeHeader.style.marginBottom = '8px';
    
    const codeTitle = document.createElement('div');
    codeTitle.style.fontWeight = '600';
    codeTitle.style.fontSize = '11px';
    codeTitle.textContent = 'Submission Code';
    
    const copyCodeButton = document.createElement('button');
    copyCodeButton.textContent = 'Copy Code';
    copyCodeButton.style.padding = '4px 8px';
    copyCodeButton.style.fontSize = '10px';
    copyCodeButton.style.background = '#007bff';
    copyCodeButton.style.color = 'white';
    copyCodeButton.style.border = 'none';
    copyCodeButton.style.borderRadius = '3px';
    copyCodeButton.style.cursor = 'pointer';
    
    copyCodeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(details.code || 'No code available');
    });
    
    codeHeader.appendChild(codeTitle);
    codeHeader.appendChild(copyCodeButton);
    
    const codeContent = document.createElement('div');
    codeContent.style.background = '#f8f9fa';
    codeContent.style.padding = '8px';
    codeContent.style.borderRadius = '4px';
    codeContent.style.fontFamily = 'monospace';
    codeContent.style.fontSize = '10px';
    codeContent.style.maxHeight = '200px';
    codeContent.style.overflowY = 'auto';
    codeContent.style.whiteSpace = 'pre-wrap';
    codeContent.style.wordBreak = 'break-all';
    codeContent.textContent = details.code || 'No code available';
    
    const statsSection = document.createElement('div');
    statsSection.style.marginTop = '8px';
    statsSection.style.fontSize = '10px';
    statsSection.style.color = '#6c757d';
    statsSection.innerHTML = `
      <div>Runtime: ${details.runtimeDisplay} (${details.runtimePercentile?.toFixed(1)}%)</div>
      <div>Memory: ${details.memoryDisplay} (${details.memoryPercentile?.toFixed(1)}%)</div>
      <div>Test Cases: ${details.totalCorrect}/${details.totalTestcases}</div>
    `;
    
    codeSection.appendChild(codeHeader);
    codeSection.appendChild(codeContent);
    codeSection.appendChild(statsSection);
    
    container.appendChild(codeSection);
  }

  function displayProblems(problems) {
    const resultsContainer = resultsDiv;
    resultsContainer.innerHTML = '';

    if (problems.length === 0) {
      resultsContainer.innerHTML = '<div class="loading">No problems found</div>';
      return;
    }

    problems.forEach(problem => {
      const problemDiv = document.createElement('div');
      problemDiv.className = 'problem-item';
      
      const problemInfo = document.createElement('div');
      problemInfo.className = 'problem-info';
      
      const titleSpan = document.createElement('span');
      titleSpan.className = 'problem-title';
      titleSpan.textContent = `${problem.frontendQuestionId}. ${problem.title}`;
      
      const difficultySpan = document.createElement('span');
      difficultySpan.className = `problem-difficulty difficulty-${problem.difficulty.toLowerCase()}`;
      difficultySpan.textContent = problem.difficulty;
      
      const statusSpan = document.createElement('span');
      statusSpan.className = `solution-status ${getStatusClass(problem.status)}`;
      statusSpan.textContent = getStatusText(problem.status);
      
      problemInfo.appendChild(titleSpan);
      problemInfo.appendChild(difficultySpan);
      problemInfo.appendChild(statusSpan);
      
      problemDiv.appendChild(problemInfo);
      
      // Create details section
      const detailsDiv = createProblemDetails(problem);
      problemDiv.appendChild(detailsDiv);
      
      // Create submission section
      const submissionSection = createSubmissionSection(problem);
      problemDiv.appendChild(submissionSection);
      
      // Handle click to expand/collapse
      problemDiv.addEventListener('click', async () => {
        const isExpanded = problemDiv.classList.contains('expanded');
        const details = problemDiv.querySelector('.problem-details');
        const submissionSection = problemDiv.querySelector('.submission-section');
        
        if (isExpanded) {
          // Collapse
          problemDiv.classList.remove('expanded');
          details.classList.remove('expanded');
          if (submissionSection) {
            submissionSection.classList.remove('expanded');
          }
        } else {
          // Expand
          problemDiv.classList.add('expanded');
          details.classList.add('expanded');
          if (submissionSection) {
            submissionSection.classList.add('expanded');
            // Automatically fetch the latest submission when expanding
            await fetchLatestSubmission(problem.titleSlug, submissionSection);
          }
        }
      });
      
      resultsContainer.appendChild(problemDiv);
    });
  }

  async function fetchProblems(forceRefresh = false) {
    fetchButton.disabled = true;
    clearCacheButton.disabled = true;
    exportButton.disabled = true;
    fetchButton.textContent = 'Fetching...';
    clearCacheButton.textContent = 'Fetching...';
    exportButton.textContent = 'Fetching...';
    hideStatus();
    showResults();
    showProgress();

    // Connect to background script for progress updates
    const port = chrome.runtime.connect({ name: 'fetchProgress' });
    
    port.postMessage({ action: 'fetchLeetCodeProblems', forceRefresh });

    port.onMessage.addListener((message) => {
      if (message.type === 'progress') {
        updateProgress(message.progress, message.currentRequest, message.totalRequests, message.start, message.end);
      } else if (message.type === 'complete') {
        hideProgress();
        if (message.result.success) {
          const cacheStatus = message.result.cached ? ' (cached)' : ' (fresh)';
          showStatus(`Successfully fetched ${message.result.problems.length} problems!${cacheStatus}`, 'success');
          displayProblems(message.result.problems);
        } else {
          showStatus(`Error: ${message.result.error}`, 'error');
          resultsDiv.innerHTML = '<div class="loading">Failed to fetch problems</div>';
        }
        port.disconnect();
      } else if (message.type === 'error') {
        hideProgress();
        showStatus(`Error: ${message.error}`, 'error');
        resultsDiv.innerHTML = '<div class="loading">Failed to fetch problems</div>';
        port.disconnect();
      }
    });

    port.onDisconnect.addListener(() => {
      // Handle port disconnection
      console.log('Port disconnected');
    });
  }

  async function clearCache() {
    try {
      clearCacheButton.disabled = true;
      clearCacheButton.textContent = 'Clearing...';
      
      const response = await chrome.runtime.sendMessage({
        action: 'clearCache'
      });
      
      if (response.success) {
        showStatus('Cache cleared successfully!', 'success');
        hideResults();
      } else {
        throw new Error(response.error || 'Failed to clear cache');
      }
    } catch (error) {
      showStatus(`Error clearing cache: ${error.message}`, 'error');
    } finally {
      clearCacheButton.disabled = false;
      clearCacheButton.textContent = 'Clear Cache';
    }
  }

  async function exportProblems() {
    try {
      exportButton.disabled = true;
      exportButton.textContent = 'Exporting...';
      
      showStatus('Preparing export with latest submissions...', 'info');
      
      console.log('Sending exportProblemsWithSubmissions request...');
      
      // Use the background script to efficiently export problems with submissions
      const response = await chrome.runtime.sendMessage({
        action: 'exportProblemsWithSubmissions'
      });
      
      console.log('Received response:', response);
      
      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to export problems - no response received');
      }
      
      const { data, totalProblems, submissionsFound } = response;
      
      console.log('Export data:', { totalProblems, submissionsFound });
      
      // Create a blob with the JSON data
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leetcode-problems-with-submissions-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showStatus(`Successfully exported ${totalProblems} problems with ${submissionsFound} submissions!`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showStatus(`Error exporting problems: ${error.message}`, 'error');
    } finally {
      exportButton.disabled = false;
      exportButton.textContent = 'Export JSON';
    }
  }

  fetchButton.addEventListener('click', () => fetchProblems(false));
  
  clearCacheButton.addEventListener('click', clearCache);
  
  exportButton.addEventListener('click', exportProblems);

  // Load cached problems on popup open
  chrome.storage.local.get(['leetcodeProblems', 'lastFetchTime'], function(result) {
    if (result.leetcodeProblems && result.lastFetchTime) {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      
      if (now - result.lastFetchTime < oneHour) {
        // Use cached data if it's less than 1 hour old
        showStatus('Using cached data (fetched within last hour)', 'info');
        displayProblems(result.leetcodeProblems);
        showResults();
      }
    }
  });
}); 