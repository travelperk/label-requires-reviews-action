import {
  getRulesForLabels,
  getMaxReviewNumber,
  getCurrentReviewCount,
  findRepositoryInformation,
} from './main'
import { Toolkit, ToolkitOptions } from 'actions-toolkit'
import {
  Rule,
  IssuesListLabelsOnIssueParams,
  PullsListReviewsParams,
} from './types'

import yaml from 'js-yaml'
import fs from 'fs'

const args: ToolkitOptions = {
  event: [
    'pull_request.opened',
    'pull_request.reopened',
    'pull_request.labeled',
    'pull_request.unlabeled',
    'pull_request.synchronize',
    'pull_request_target.opened',
    'pull_request_target.reopened',
    'pull_request_target.labeled',
    'pull_request_target.unlabeled',
    'pull_request_target.synchronize',
    'pull_request_review.submitted',
    'pull_request_review.edited',
    'pull_request_review.dismissed',
  ],
  secrets: ['GITHUB_TOKEN'],
}

Toolkit.run(async (toolkit: Toolkit) => {
  toolkit.log.info('Running Action')
  const configPath: string =
    process.env.CONFIG_PATH ?? '.github/label-requires-reviews.yml'
  const rules: Rule[] = []
  const parseYamlRules = (rulesYaml: String) => {
    const rulesObject = yaml.load(rulesYaml)
    if (Array.isArray(rulesObject)) {
      return rulesObject
    } else {
      return Object.entries(rulesObject).map(([key, value]) => {
        return { label: key, reviews: value }
      })
    }
  }
  if (toolkit.inputs.rules_yaml) {
    rules.push(...parseYamlRules(toolkit.inputs.rules_yaml))
  }
  if (fs.existsSync(configPath)) {
    rules.push(...parseYamlRules(fs.readFileSync(configPath, 'utf8')))
  }
  toolkit.log.info('Configured rules: ', rules)

  // Get the repository information
  if (!process.env.GITHUB_EVENT_PATH) {
    toolkit.exit.failure('Process env GITHUB_EVENT_PATH is undefined')
  }
  const { owner, issue_number, repo }: IssuesListLabelsOnIssueParams =
    findRepositoryInformation(
      process.env.GITHUB_EVENT_PATH,
      toolkit.log,
      toolkit.exit
    )
  const client = toolkit.github

  // Get the list of configuration rules for the labels on the issue
  const matchingRules: Rule[] = await getRulesForLabels(
    { owner, issue_number, repo },
    client,
    rules
  )
  toolkit.log.info('Matching rules: ', matchingRules)

  // Get the required number of required reviews from the rules
  const requiredReviews: number = getMaxReviewNumber(matchingRules)

  // Get the actual number of reviews from the issue
  const reviewCount: number = await getCurrentReviewCount(
    { owner, pull_number: issue_number, repo } as PullsListReviewsParams,
    client
  )
  if (reviewCount < requiredReviews) {
    toolkit.exit.failure(
      `Labels require ${requiredReviews} reviews but the PR only has ${reviewCount}`
    )
  }
  toolkit.exit.success(
    `Labels require ${requiredReviews} the PR has ${reviewCount}`
  )
}, args)
