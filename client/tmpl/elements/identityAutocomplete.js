import Identity from '/client/lib/identity'
import Anon from '/client/lib/identity/anon'

const tmpl = Template.Element_IdentityAutocomplete

const bindSearch = (tmplIns) => {
  const keybaseEl = tmplIns.$('.keybaseEl')
  tmplIns.$('.ui.search').search({
    apiSettings: {
      url: 'https://keybase.io/_/api/1.0/user/autocomplete.json?q={query}',
      onResponse: (res) => {
        const additionalElements = []
        const query = $('.ui.search .prompt').val()

        if (web3.isAddress(query)) {
          additionalElements.push(Anon.format({ ethereumAddress: query }))
        }

        if (query === '' || query === 'me') {
          const cur = Identity.current()
          cur.name = 'Me'
          additionalElements.push(cur)
        }

        return {
          results: (res.completions||[]).map(c => ({
            username: c.components.username.val,
            name: (c.components.full_name || {}).val,
            picture: c.thumbnail || 'http://placekitten.com/g/64/64',
          })).concat(additionalElements),
        }
      },
    },
    fields: {
      title: 'name',
      description: 'username',
      image: 'picture',
    },
    minCharacters: 0,
    onSelect: async (user) => {
      tmplIns.$('.ui.search').addClass('loading')
      let entity = user
      if (entity.ethereumAddress !== Identity.current().ethereumAddress) {
        if (web3.isAddress(user.username)) {
          entity.ethereumAddress = entity.username
          delete entity.username
        } else {
          entity = await Identity.getUsername(user.username, 'keybase')
        }
      }
      TemplateVar.set(tmplIns, 'entity', entity)
      keybaseEl.trigger('select', entity)
    },
  })
}

tmpl.onRendered(() => bindSearch(Template.instance()))

tmpl.events({
  'click .remove': () => {
    TemplateVar.set('entity', null)
    setTimeout(bindSearch.bind(this, Template.instance()), 100)
  },
})

tmpl.helpers({
  entity: () => TemplateVar.get('entity'),
})
