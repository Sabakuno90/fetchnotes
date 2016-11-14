const axios = require('axios')
const fs = require('fs')
const csv = require('json2csv')

const base = 'https://api.github.com'

let nodes = []
let edges = []

axios.get(`${base}/search/repositories?q=language:javascript&sort=stars`)
  .then(res => {
    const rps = res.data.items.slice(0, 5)
    const requests = []

    rps.forEach(r => {
      nodes.push({
        Id: r.id,
        Label: r.name,
        size: r.size,
        type: 'repo'
      })

      console.log(`Added repo '${r.name}'`)

      requests.push(axios.get(r.contributors_url)
        .then(resp => {
          resp.data.forEach(c => {
            nodes.push({
              Id: c.id,
              Label: c.login,
              type: 'user'
            })

            edges.push({
              source: r.id,
              target: c.id,
              weight: c.contributions
            })

            console.log(`Added contributors and edges for repo '${r.name}'`)
          })
        }))
    })

    axios.all(requests)
      .then(() => {
        fs.writeFile('data/repos.csv', csv({ data: repos }), () => {})
        fs.writeFile('data/users.csv', csv({ data: users }), () => {})
        fs.writeFile('data/edges.csv', csv({ data: edges }), () => {})

        console.log('Wrote files')
      })
  })
