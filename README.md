# LeetCode Problem Fetcher Extension

A Chrome/Firefox browser extension that fetches all LeetCode problems using their GraphQL API, similar to the functionality in the [leetcode-anki](https://github.com/fspv/leetcode-anki) project.

## Features

- **Fetch All Problems**: Retrieves all LeetCode problems using the official GraphQL API
- **Auto-Fetch Latest Submission**: Automatically fetches the latest accepted submission when you expand a problem
- **View Submission Code**: See the actual source code, runtime, memory usage, and test case results
- **Export with Submissions**: Export all problems with their latest accepted submissions in JSON format
- **Beautiful UI**: Clean, modern interface with problem difficulty indicators
- **Caching**: Automatically caches problems for 1 hour and submissions for 30 minutes to reduce API calls
- **Click to Open**: Click on any problem to open it directly on LeetCode
- **Cross-browser**: Works on both Chrome and Firefox

## Installation

### Chrome
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your toolbar

### Firefox
1. Download or clone this repository
2. Open Firefox and go to `about:debugging`
3. Click "This Firefox" in the sidebar
4. Click "Load Temporary Add-on" and select the `manifest.json` file
5. The extension icon should appear in your toolbar

## Usage

1. Click the extension icon in your browser toolbar
2. Click "Fetch All Problems" to retrieve the latest problem list
3. Browse through the problems - they're sorted by ID and show difficulty levels
4. Click on any problem to expand and see details
5. The latest accepted submission will be automatically fetched and displayed
6. Click "View Code" to see the actual source code and performance metrics
7. Use "Copy Code" to copy the solution code to your clipboard
8. Click "Export JSON" to download all problems with their latest submissions
9. The extension will cache results to improve performance

## How It Works

The extension uses LeetCode's official GraphQL API endpoint (`https://leetcode.com/graphql`) to fetch:

### Problem Data
- Problem ID and title
- Difficulty level
- Acceptance rate
- Topic tags
- Problem slug (for URL generation)
- Premium status
- Solution availability

### Submission Data
- Latest accepted submission for each problem (automatically fetched)
- Submission details including:
  - Source code
  - Runtime and memory usage
  - Performance percentiles
  - Test case results
  - Programming language used
  - Submission timestamp

## Files Structure

```
├── manifest.json      # Extension manifest (Chrome/Firefox)
├── popup.html         # Extension popup interface
├── popup.js           # Popup logic and UI interactions
├── background.js      # Service worker for API calls
├── content.js         # Content script for LeetCode pages
└── README.md          # This file
```

## API Details

The extension uses three main GraphQL queries:

### Problems Query
```graphql
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
```

### Submissions Query
```graphql
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
```

**Note**: The extension uses `limit: 1` and `status: 10` (Accepted) to fetch only the latest accepted submission.

### Submission Details Query
```graphql
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
```

## Permissions

The extension requires the following permissions:
- `activeTab`: To interact with the current tab
- `storage`: To cache problem and submission data locally
- `https://leetcode.com/*`: To make API requests to LeetCode

## Development

To modify or extend the extension:

1. Edit the relevant files
2. Reload the extension in your browser
3. Test the changes

### Adding Features

You can extend the extension by:
- Adding filters (by difficulty, tags, etc.)
- Implementing search functionality
- Adding problem statistics
- Tracking completion status
- Exporting problem lists
- Adding more submission analysis features

## Troubleshooting

- **API Errors**: If you see API errors, LeetCode may have changed their API. Check the browser console for details.
- **CORS Issues**: The extension handles CORS by making requests from the background script.
- **Caching**: Clear the extension's storage if you need fresh data immediately.
- **Submission Access**: Some submissions may not be accessible due to privacy settings or API limitations.

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues and enhancement requests! 