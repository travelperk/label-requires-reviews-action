import { Endpoints } from '@octokit/types'

export interface Rule {
  label: string
  reviews: number
}

export type IssuesListLabelsOnIssueParams =
  Endpoints['GET /repos/:owner/:repo/issues/:issue_number/labels']['parameters']
export type IssuesListLabelsOnIssueResponse =
  Endpoints['GET /repos/:owner/:repo/issues/:issue_number/labels']['response']
export type PullsListReviewsParams =
  Endpoints['GET /repos/:owner/:repo/pulls/:pull_number/reviews']['parameters']
export type PullsListReviewsResponse =
  Endpoints['GET /repos/:owner/:repo/pulls/:pull_number/reviews']['response']
