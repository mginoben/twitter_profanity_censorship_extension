function sendToGithub(content) {
    // Set the username, repository name, and path to the file you want to create or update
    const username = 'mginoben';
    const repoName = 'twitter_profanity_censorship_extension';
    const path = 'raw.txt';

    // Set the authentication token for accessing the GitHub API
    const token = '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';

    // Convert the content to a string
    const contentString = JSON.stringify(content);

    // Define the API endpoint for creating or updating a file
    const apiUrl = `https://api.github.com/repos/${username}/${repoName}/contents/${path}`;

    // Define the API request options
    const options = {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        message: 'Update file',
        content: btoa(contentString),
        sha: null
    })
    };

    // Make the API request
    // First, get the existing file's SHA hash
    fetch(apiUrl, {
        headers: {
        Authorization: `token ${token}`,
        },
    })
        .then((response) => response.json())
        .then((data) => {
        const sha = data.sha;
    
        // Now update the file with the new content
        return fetch(apiUrl, {
            method: 'PUT',
            headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            message: "Update file",
            content: btoa(contentString),
            sha: sha,
            }),
        });
        })
        .then((response) => response.json())
        .then((data) => {
        console.log(`File updated: ${data.content.path}`);
        })
        .catch((error) => {
        console.error(error);
        });

}
