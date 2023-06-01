// Copyright (c)2023 Quinn Michaels
// The Docs Deva

const fs = require('fs');
const path = require('path');
const package = require('./package.json');
const info = {
  id: package.id,
  name: package.name,
  describe: package.description,
  version: package.version,
  url: package.homepage,
  git: package.repository.url,
  bugs: package.bugs.url,
  author: package.author,
  license: package.license,
  copyright: package.copyright,
};

const data_path = path.join(__dirname, 'data.json');
const {agent,vars} = require(data_path).data;

const Deva = require('@indra.ai/deva');
const DOCS = new Deva({
  info,
  agent: {
    id: agent.id,
    key: agent.key,
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
    doc(loc=false) {
      const docArr = loc ? loc.split(':') : [];
      const part = docArr[1] ? docArr[1].toUpperCase() : this.vars.part;
      const fDoc = docArr.length ? docArr[0] + '.feecting' : 'main.feecting';
      const fDocs = path.join(this.config.dir, 'docs');
      const fPath = path.join(fDocs, fDoc);
      try {
        let doc = fs.readFileSync(fPath, 'utf8');
        if (part) doc = doc.split(`::BEGIN:${part}`)[1].split(`::END:${part}`)[0];
        return doc;
      }
      catch (err) {
        return err;
      }
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
      const agent = this.agent();
      return new Promise((resolve, reject) => {
        const doc = this.func.doc(packet.q.text);
        this.question(`#feecting parse:${agent.key} ${doc}`).then(feecting => {
          return resolve({
            text: feecting.a.text,
            html: feecting.a.html,
            data: feecting.a.data,
          });
        }).catch(err => {
          return this.error(err, packet, reject);
        })
      });
    },

    /**************
    method: raw
    params: packet
    describe: The raw method replays the request to the view function to return
    a document from the text parameter.
    ***************/
    raw(packet) {
      const agent = this.agent();
      return new Promise((resolve, reject) => {
        try {
          const text = this.func.doc(packet.q.text);
          return resolve({text})
        } catch (e) {
          return this.error(e, packet, reject);
        }
      });
    },

    /**************
    method: send
    params: packet
    describe: send a doc to another deva.
    ***************/
    send(packet) {
      this.context('send');
      const agent = this.agent();
      const data = {}, text = [];

      const send = packet.q.meta.params[1];

      return new Promise((resolve, reject) => {
        if (!send) return resolve(this._messages.notext);

        this.context('send_get');
        const theDoc = this.func.doc(packet.q.text);
        this.context('send_feecting');
        this.question(`#feecting parse ${theDoc}`).then(feecting => {
          data.feecting = feecting.a.data;
          this.context('send_relay');
          return this.question(`#${send} relay ${feecting.a.text}`);
        }).then(relay => {
          data.relay = relay.a.data;
          const output = [
            `::BEGIN:MAIN:${relay.id}`,
            relay.a.text,
            '',
            '#color = var(--color-green)',
            '#bgcolor = var(--color-darkest-grey)',
            `::END:MAIN:${this.hash(relay.a.text)}`,
          ].join('\n');
          this.context('send_feecting');
          return this.question(`#feecting parse ${output}`)
        }).then(parsed => {
          data.parsed = parsed.a.data;
          this.context('send_done');
          return resolve({
            text: parsed.a.text,
            html: parsed.a.html,
            data,
          });
        }).catch(err => {
          return this.error(err, packet, reject);
        });
      });
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
        }).catch(err => {
          return this.error(err, packet, reject);
        });
      });
    }
  },
});
module.exports = DOCS
