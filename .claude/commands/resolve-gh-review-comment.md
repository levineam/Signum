# Resolve GitHub PR Review Comment

---
description: Resolve GitHub PR Review Comment
argument-hint: <comment_url or review_url> [--resolve]
---

This guide explains how to resolve a specific review comment on a GitHub Pull Request.

If $ARGUMENTS contains `--resolve`, the comment will be resolved after replying.

## URL Format Detection

GitHub review URLs come in TWO formats:

1. **Single Comment URL**: `https://github.com/{owner}/{repo}/pull/{pr_number}#discussion_r{comment_id}`
   - Links to one specific comment in a review
   - Example: `#discussion_r2404742346`

2. **Review URL**: `https://github.com/{owner}/{repo}/pull/{pr_number}#pullrequestreview-{review_id}`
   - Links to an entire review (may contain multiple comments)
   - Example: `#pullrequestreview-3302627440`

## Steps

1. **Detect URL type and extract IDs**

    Parse $ARGUMENTS to determine which type of URL was provided:

    **If URL contains `#discussion_r` (single comment):**
    - Extract comment_id from the fragment
    - Proceed to step 2

    **If URL contains `#pullrequestreview-` (review):**
    - Extract review_id from the fragment
    - Extract PR number and repo info from the URL
    - Fetch all comments in that review:
      ```bash
      gh api repos/{owner}/{repo}/pulls/{pr_number}/reviews/{review_id}/comments
      ```
    - If review contains multiple comments, list them and ask user which to address
    - If review contains one comment, use that comment_id
    - Proceed to step 2

2. **Check the specific comment**

    ```bash
    gh api repos/{owner}/{repo}/pulls/comments/{comment_id}
    ```
    Example:
    ```bash
    gh api repos/levineam/Signum/pulls/comments/2404742346
    ```

3. **Read and check the relevant codes**

    - Read the comment and suggestion.
    - Check the relevant codes.
    - Think deeply whether to follow the suggestion.

4. **Fix the issue**

    - Make the necessary code changes based on the review feedback
    - Ensure the fix addresses the reviewer's concerns

5. **Commit and push**

    - Stage your changes
    - Create a descriptive commit message
    - Push to the feature branch

6. **Reply to the comment**

    ```bash
    gh api -X POST repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
        -f body="Fixed in commit {commit_sha}. {description_of_fix}"
    ```

    If fixed, please reply with commit link:

    Example:
    ```bash
    gh api -X POST repos/nakamasato/github-actions-practice/pulls/2239/comments/2196280386/replies \
        -f body="Fixed in commit 2b36629. The redundant existence check has been removed since main() already validates the metadata file."
    ```
    Otherwise, just reply to the comment.

7. **Resolve the review comment only if specified --resolve**

    Resolve the review comment only when `--resolve` option is specified in $ARGUMENTS.

    First, get the thread ID:
    ```bash
    gh api graphql -f query='
    query {
        repository(owner: "{owner}", name: "{repo}") {
        pullRequest(number: {pr_number}) {
            reviewThreads(first: 50) {
            nodes {
                id
                isResolved
                comments(first: 1) {
                nodes {
                    id
                    body
                }
                }
            }
            }
        }
        }
    }'
    ```

    Then resolve the thread:
    ```bash
    gh api graphql -f query='
    mutation {
        resolveReviewThread(input: {threadId: "{thread_id}"}) {
        thread {
            isResolved
        }
        }
    }'
    ```

    Example:
    ```bash
    gh api graphql -f query='
    mutation {
        resolveReviewThread(input: {threadId: "PRRT_kwDOOybamM5TqrEt"}) {
        thread {
            isResolved
        }
        }
    }'
    ```

## Notes

- **URL Fragment Types:**
  - Comment: `#discussion_r{comment_id}` - links to a single comment
  - Review: `#pullrequestreview-{review_id}` - links to entire review (may have multiple comments)
- **API Endpoints:**
  - Get review comments: `GET /repos/{owner}/{repo}/pulls/{pr}/reviews/{review_id}/comments`
  - Get single comment: `GET /repos/{owner}/{repo}/pulls/comments/{comment_id}`
  - Reply to comment: `POST /repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}/replies`
- Thread IDs are different from comment IDs and must be retrieved via GraphQL
- Only users with write access can resolve review threads
- The thread will be automatically marked as resolved when using the GraphQL mutation

## Common Pitfalls

1. **Don't use GraphQL to fetch all PR comments** when you have a specific review ID
   - ❌ Bad: Query all reviewThreads, then search for matching comment
   - ✅ Good: Use `GET /repos/{owner}/{repo}/pulls/{pr}/reviews/{review_id}/comments`

2. **Review URLs vs Comment URLs** - they require different API endpoints
   - Review URL → fetch review's comments first → then get specific comment
   - Comment URL → directly fetch comment

3. **Multiple comments in one review** - always list them and confirm with user before proceeding
