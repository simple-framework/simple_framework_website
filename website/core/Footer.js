/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

class Footer extends React.Component {
  docUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    const docsUrl = this.props.config.docsUrl;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
    const langPart = `${language ? `${language}/` : ''}`;
    return `${baseUrl}${docsPart}${langPart}${doc}`;
  }

  pageUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + (language ? `${language}/` : '') + doc;
  }

  render() {
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            {this.props.config.footerIcon && (
              <img
                src={this.props.config.baseUrl + this.props.config.footerIcon}
                alt={this.props.config.title}
                width="66"
                height="58"
              />
            )}
          </a>
          <div>
            <h5>Docs</h5>
            {/*<a href={this.docUrl('doc1.html', this.props.language)}>*/}
            {/*  Getting Started (or other categories)*/}
            {/*</a>*/}
            <a href="https://indico.cern.ch/event/869667/contributions/3670162/">
              Introduction to SIMPLE
            </a>
            <a href={this.docUrl('deployment_guide_htcondor.html', this.props.language)}>
              Deployment Guide: HTCondor
            </a>
          </div>
          <div>
            <h5>Community</h5>
            <a href="mailto:mayank.sharma@cern.ch?Subject=Query about SIMPLE Framework">
              Email
            </a>
            <a
              href="https://join.slack.com/t/simple-framework/shared_invite/enQtODE4NzY2MTk2OTY0LWZmNjQ0NThmNDRiMzc1YTUxMzU3MTNjOGU4YWRlN2E0MzI5NjQ3ZDNjMDkxYjYzMjdkZGQyNzJjNmMwNzlmNWY"
              target="_blank"
              rel="noreferrer noopener">
              Slack Channel
            </a>
            <a
              href="https://e-groups.cern.ch/e-groups/Egroup.do?egroupId=10285344"
              target="_blank"
              rel="noreferrer noopener">
              CERN E-Groups
            </a>
          </div>
          <div>
            <h5>More</h5>
            <a href={`${this.props.config.baseUrl}blog`}>Blog</a>
            <a href="https://github.com/simple-framework">GitHub</a>
            <a
              className="github-button"
              href={this.props.config.repoUrl}
              data-icon="octicon-star"
              data-count-href="/facebook/docusaurus/stargazers"
              data-show-count="true"
              data-count-aria-label="# stargazers on GitHub"
              aria-label="Star this project on GitHub">
              Star
            </a>
            {this.props.config.twitterUsername && (
              <div className="social">
                <a
                  href={`https://twitter.com/${this.props.config.twitterUsername}`}
                  className="twitter-follow-button">
                  Follow @{this.props.config.twitterUsername}
                </a>
              </div>
            )}
            {this.props.config.facebookAppId && (
              <div className="social">
                <div
                  className="fb-like"
                  data-href={this.props.config.url}
                  data-colorscheme="dark"
                  data-layout="standard"
                  data-share="true"
                  data-width="225"
                  data-show-faces="false"
                />
              </div>
            )}
          </div>
        </section>

        <a
          href="http://wlcg.web.cern.ch/"
          target="_blank"
          rel="noreferrer noopener"
          className="fbOpenSource">
          <img
            src={`${this.props.config.baseUrl}img/wlcg-logo.png`}
            alt="WLCG Logo"
            width="170"
            height="45"
          />
        </a>
        <section className="copyright">{this.props.config.copyright}</section>
      </footer>
    );
  }
}

module.exports = Footer;
