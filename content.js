// Content script for LeetCode Problem Fetcher
// This script runs on LeetCode pages and can be used for additional functionality

console.log('LeetCode Problem Fetcher content script loaded');

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentProblem') {
    // Extract current problem information from the page
    const problemInfo = extractCurrentProblemInfo();
    sendResponse(problemInfo);
  }
});

// Function to extract current problem information from the page
function extractCurrentProblemInfo() {
  try {
    // This is a basic implementation - you can enhance it based on your needs
    const titleElement = document.querySelector('[data-cy="question-title"]');
    const title = titleElement ? titleElement.textContent : '';
    
    const difficultyElement = document.querySelector('[diff]');
    const difficulty = difficultyElement ? difficultyElement.getAttribute('diff') : '';
    
    // Extract problem ID from URL or page
    const urlMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
    const titleSlug = urlMatch ? urlMatch[1] : '';
    
    return {
      title,
      difficulty,
      titleSlug,
      url: window.location.href
    };
  } catch (error) {
    console.error('Error extracting problem info:', error);
    return null;
  }
}

// You can add more functionality here as needed
// For example, you could:
// - Track problem completion status
// - Extract problem description
// - Get user submission history
// - etc. 