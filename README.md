# Label requires reviews actions
This is work in progress Github Action to require a minimum number of approving reviews on a Pull Request depending on the set of labels applied to it.

## Usage

### Create `.github/label-requires-reviews.yml`

Create a `.github/label-requires-reviews.yml` file containing the pairs of `label` and `reviews`. `lablel` is the name of the label that will be checked on the Pull Request and `reviews` the number of approved reviews needed on the Pull Request for the action to return a success value. In case of having several matching tags the highest number will apply.

Here is an example:

```yml
- label: "typescript"
  reviews: 2
- label: "migration"
  reviews: 5
```

With that configuration this check will fail on a Pull Request that has the `typescript` tag until two or more approving reviews have been added. If instead the Pull Request has the `migration` tag  it will require five, in case both tags are present it will also require five.

### Create workflow
Create a workflow (eg: `.github/workflows/label-reviews.yml` see [Creating a Workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file)) to utilize this action with content:

```yml
# This workflow will set a number or reviewers depending on the tags
name: Label Reviews
# Trigger the workflow on pull requests
on:
  pull_request:
    types:
      - labeled
      - unlabeled
      - ready_for_review
  pull_request_review:
    types:
      - submitted
      - edite_d
      - dismissed
jobs:
  require-reviewers:
    runs-on: ubuntu-18.04
    steps:
      - uses: actions/checkout@v2
        with:
          ref: master

      - name: Require-reviewers
        uses: travelperk/label-requires-reviews-action@v0.1-alpha3
        env:
          GITHUB_TOKEN: ${{ secrets.PERSONAL_ACCESS_TOKEN}}
```

In order for the workflow to be able to perform actions on the Pull Request you'll need to set a `PERSONAL_ACCESS_TOKEN` secret on the repository see [Creating and storing encrypted secrets](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets).
