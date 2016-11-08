const axios = require('axios')
const fs = require('fs')

const base = 'https://api.github.com'

let repos = {}
let users = {}
let edges = []

axios.get(`${base}/search/repositories?q=language:javascript&sort=stars`)
  .then(res => {
    const rps = res.data.items.slice(0, 5)
    const requests = []

    rps.forEach(r => {
      repos[r.id] = {
        name: r.name,
        size: r.size
      }

      console.log(`Added repo '${r.name}'`)

      requests.push(axios.get(r.contributors_url)
        .then(resp => {
          resp.data.forEach(c => {
            users[c.id] = {
              name: c.login
            }

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
        fs.writeFile('data/repos.json', JSON.stringify(repos), () => {})
        fs.writeFile('data/users.json', JSON.stringify(users), () => {})
        fs.writeFile('data/edges.json', JSON.stringify(edges), () => {})

        console.log('Wrote files')
      })
  })
