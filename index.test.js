// Copyright ©2025 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under VLA:14415279507214091167 LICENSE.md

// Docs Deva test file

const {expect} = require('chai')
const docs = require('./index.js');

describe(docs.me.name, () => {
  beforeEach(() => {
    return docs.init()
  });
  it('Check the SVARGA Object', () => {
    expect(docs).to.be.an('object');
    expect(docs).to.have.property('me');
    expect(docs).to.have.property('vars');
    expect(docs).to.have.property('listeners');
    expect(docs).to.have.property('methods');
    expect(docs).to.have.property('modules');
  });
})
