const axios = require('axios')
const fs = require('fs')
const csv = require('json2csv')
const chalk = require('chalk')

const base = 'https://api.github.com'
const langs = process.argv[2].split(',')

let nodes = []
let edges = []

const fetch = () => {
  const lang = langs.shift()

  console.log(`Fetching repositories for language '${lang}'.`)
  console.log('================================================================================\n')

  axios.get(`${base}/search/repositories?q=language:${lang}&sort=stars`)
    .then(res => {
      const rps = res.data.items.slice(0, 60)
      const requests = []

      rps.forEach(r => {
        nodes.push({
          Id: r.id,
          Label: r.full_name,
          size: r.size,
          fork: r.fork,
          forks: r.forks,
          stars: r.stargazers_count,
          issues: r.open_issues_count,
          owner: r.owner.type,
          language: r.language,
          created: r.created_at,
          updated: r.updated_at,
          type: 'repo'
        })

        requests.push(axios.get(r.contributors_url)
          .then(resp => {
            resp.data.forEach(c => {
              nodes.push({
                Id: c.id,
                Label: c.login,
                type: 'user'
              })

              edges.push({
                source: c.id,
                target: r.id,
                weight: c.contributions
              })

              console.log(`${chalk.yellow('·')} Added repo '${r.name}'.`)
            })
          })
        )
      })

      axios.all(requests)
        .then(() => {
          fs.writeFile('data/edges.csv', csv({ data: edges }), () => {})
          fs.writeFile('data/nodes.csv', csv({ data: nodes }), () => {})

          console.log(`\n${chalk.green('✓')} Wrote files\n`)

          setTimeout(() => langs.length && fetch(), 3600000)
        })
        .catch(() => {
          console.log(`${chalk.red('ERROR')} Could not retrieve data due to rate limiting issue.`)
        })
    })
    .catch(err => {
      console.log(`${chalk.red('ERROR')} Could not retrieve data due to rate limiting issue.`)
    })
}

fetch()
