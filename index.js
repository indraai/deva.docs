// Copyright (c)2022 Quinn Michaels
// The Docs Deva

const fs = require('fs');
const path = require('path');

const data_path = path.join(__dirname, 'data.json');
const {agent,vars} = require(data_path).data;

const Deva = require('@indra.ai/deva');
const DOCS = new Deva({
  agent: {
    uid: agent.uid,
    key: agent.key,
    name: agent.name,
    describe: agent.describe,
    prompt: agent.prompt,
    voice: agent.voice,
    profile: agent.profile,
    translate(input) {
      return input.trim();
    },
    parse(input) {
      return input.trim();
    }
  },
  vars,
  listeners: {},
  modules: {},
  deva: {},
  func: {

    /**************
    func: view
    params: opts
    describe: The view function parses the text parameter to prdoce the string
    which calls the correct document file then passes it to the feecting deva
    for parsing.
    ***************/
    view(opts) {
      return new Promise((resolve, reject) => {
        const docArr = opts.q.text ? opts.q.text.split(':') : [];
        const part = docArr[1] ? docArr[1].toUpperCase() : this.vars.part;
        const fDoc = docArr.length ? docArr[0] + '.feecting' : 'main.feecting';
        const fDocs = path.join(this.config.dir, 'docs');
        const fPath = path.join(fDocs, fDoc);
        try {
          let doc = fs.readFileSync(fPath, 'utf8');
          if (part) doc = doc.split(`::BEGIN:${part}`)[1].split(`::END:${part}`)[0];

          this.question(`#feecting parse:${this.agent.key} ${doc}`).then(parsed => {
            return resolve({
              text: parsed.a.text,
              html: parsed.a.html,
              data: parsed.a.data,
            });
          });
        } catch (err) {
          return this.error(err, opts, reject);
        }
      });
    },
  },
  methods: {
    /**************
    method: view
    params: packet
    describe: The view method replays the request to the view function to return
    a document from the text parameter.
    ***************/
    view(packet) {
      return this.func.view(packet);
    },

    /**************
    method: uid
    params: packet
    describe: Generaate a uid from the unique id generator
    ***************/
    uid(packet) {
      return Promise.resolve({text:this.uid()});
    },

    /**************
    method: status
    params: packeet
    describe: The status method returns the status of the Docs Deva.
    ***************/
    status(packet) {
      return this.status();
    },

    /**************
    method: help
    params: packet
    describe: Call the docs deva help files then pass to feecting for parsing.
    ***************/
    help(packet) {
      return new Promise((resolve, reject) => {
        this.lib.help(packet.q.text, __dirname).then(text => {
          return this.question(`#feecting parse:${this.agent.key} ${text}`);
        }).then(parsed => {
          return resolve({
            text:parsed.a.text,
            html:parsed.a.html,
            data:parsed.a.data,
          });
        }).catch(reject);
      });
    }
  },
});
module.exports = DOCS
