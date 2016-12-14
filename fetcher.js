const axios = require('axios')
const fs = require('fs')
const csv = require('json2csv')
const chalk = require('chalk')

const base = 'https://api.github.com'
const clientID = '2a80f2fb987bb1ac87ed'
const clientSecret = '519bab2e1d76ce2dfa130a7ba0a52eef5bee377e'

const langs = process.argv[2] && process.argv[2].split(',') || [ 'javascript', 'java', 'python', 'php', 'ruby', 'haskell', 'lisp', 'swift' ]

const fetch = () => {
  const lang = langs.shift()

  let nodes = []
  let edges = []

  console.log(`${chalk.blue(`[${lang}]`)}${' '.repeat(11 - lang.length) || ''}\tFetching popular repositories`)

  axios.get(`${base}/search/repositories?q=language:${lang}&sort=stars`)
    .then(res => {
      const rps = res.data.items.slice(0, 30)
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

        requests.push(axios.get(`${r.contributors_url}?client_id=${clientID}&client_secret=${clientSecret}`)
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
            })

            console.log(`${chalk.yellow(`[${lang}]`)}${' '.repeat(11 - lang.length) || ''}\tAdded repo '${r.name}'`)
          })
        )
      })

      axios.all(requests)
        .then(() => {
          fs.writeFile(`data/edges-${lang}.csv`, csv({ data: edges }), () => {})
          fs.writeFile(`data/nodes-${lang}.csv`, csv({ data: nodes }), () => {})

          console.log(`${chalk.green(`[${lang}]`)}${' '.repeat(11 - lang.length) || ''}\tWrote files`)
        })
        .catch(() => {})
    })
    .catch(() => {})
}

while (langs.length) {
  fetch()
}
