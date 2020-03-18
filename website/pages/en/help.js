/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');

const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

function Help(props) {
  const {config: siteConfig, language = ''} = props;
  const {baseUrl, docsUrl} = siteConfig;
  const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
  const langPart = `${language ? `${language}/` : ''}`;
  const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

  const supportLinks = [
    {
      content: `Learn more using the [documentation on this site.](${docUrl(
        'deployment_guide_htcondor.html',
      )}) or go through this [presentation](https://indico.cern.ch/event/869667/contributions/3670162/) from WLCG Operations Coordination meeting to get more insights into the project`,
      title: 'Browse Docs',
    },
    {
      content: `Ask any questions about the project on [Slack](http://cern.ch/go/s7d7) or on our [Discussion Forum](https://simple-framework-talk.web.cern.ch/).`,
      title: 'Join the community',
    },
    {
      content: "Find out what's new with supported services you are interested in. Check out our [GitHub Organization](https://github.com/simple-framework)",
      title: 'Stay up to date',
    },
  ];

  return (
    <div className="docMainWrapper wrapper">
      <Container className="mainContainer documentContainer postContainer">
        <div className="post">
          <header className="postHeader">
            <h1>Need help?</h1>
          </header>
          <p>This project is maintained by a dedicated group of people.</p>
          <p>If none of the options listed below suit you, drop a line with your query/suggestion to mayank [dot] sharma [at] cern [dot] ch.</p>

          <GridBlock contents={supportLinks} layout="threeColumn" />
        </div>
      </Container>
    </div>
  );
}

module.exports = Help;
