// Copyright (c)2025 Quinn Michaels
// The Docs Deva the manages the feecting documents in Deva.space, Deva.cloud, and Deva.world.
import Deva from '@indra.ai/deva';
import pkg from './package.json' with {type:'json'};
const {agent,vars} = pkg.data;

// set the __dirname
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';    
const __dirname = dirname(fileURLToPath(import.meta.url));

const info = {
  id: pkg.id,
  name: pkg.name,
  describe: pkg.description,
  version: pkg.version,
  dir: __dirname,
  url: pkg.homepage,
  git: pkg.repository.url,
  bugs: pkg.bugs.url,
  author: pkg.author,
  license: pkg.license,
  copyright: pkg.copyright,
};
const DOCS = new Deva({
  info,
  agent,
  vars,
  utils: {
    translate(input) {return input.trim();},
    parse(input) {return input.trim();},
    process(input) {return input.trim();},
  },
  listeners: {},
  modules: {},
  func: {
    /**************
    func: view
    params: opts
    describe: The view function parses the text parameter to produce the string
    which calls the correct document file then passes it to the feecting deva
    for parsing.
    ***************/
    doc(opts) {
      this.action('func', 'doc');
      const {text, meta} = opts;
      const area = meta.params[1] ? meta.params[1] : this.vars.area;
      const part = meta.params[2] ? meta.params[2].toUpperCase() : this.vars.part;
      const docName = text.length ? text + '.feecting' : 'main.feecting';
      const docPath = this.lib.path.join(this.config.dir, area, 'docs', docName);
      try {
        let doc = this.lib.fs.readFileSync(docPath, 'utf8');
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
      
      this.context('view', packet.q.text);
      this.action('method', `view:${packet.q.text}`);
      const agent = this.agent();
      return new Promise((resolve, reject) => {
        this.state('get', packet.q.text);
        const doc = this.func.doc(packet.q);
        this.question(`${this.askChr}feecting parse ${doc}`).then(feecting => {
          this.state('resolve', `view:${packet.q.text}`);
          return resolve({
            text: feecting.a.text,
            html: feecting.a.html,
            data: feecting.a.data,
          });
        }).catch(err => {
          this.context('reject', `view:${packet.q.text}`);
          return this.error(err, packet, reject);
        })
      });
    },
    /**************
    method: raw
    params: packet
    describe: The raw method replays the request to the 
    view function to return a document from the text 
    parameter.
    ***************/
    raw(packet) {
      this.context('raw', packet.q.text);
      this.action('method', `raw:${packet.q.text}`);
      const agent = this.agent();
      return new Promise((resolve, reject) => {
        try {
          const text = this.func.doc(packet.q.text);
          this.state('resolve', `raw:${packet.q.text}`)
          return resolve(text)
        } catch (e) {
          this.state('reject', `raw:${packet.q.text}`);
          return this.error(e, packet, reject);
        }
      });
    },
  },
  onReady(data, resolve) {
    this.prompt(this.vars.messages.ready);
    return resolve(data);
  },
  onError(err, data, reject) {
    this.prompt(this.vars.messages.error);
    console.log(err);
    return reject(err);
  }
});
export default DOCS
