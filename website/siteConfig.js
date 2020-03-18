/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config for all the possible
// site configuration options.

// List of projects/orgs using your project for the users page.
const users = [
    {
        caption: 'User1',
        // You will need to prepend the image path with your baseUrl
        // if it is not '/', like: '/test-site/img/image.jpg'.
        image: '/img/undraw_open_source.svg',
        infoLink: 'https://www.facebook.com',
        pinned: true,
    },
];

const siteConfig = {
    title: 'The SIMPLE Framework', // Title for your website.
    tagline: 'A private PaaS built on top of technologies you like, to simplify the deployment of services you need!',
    url: 'https://simple-framework.github.io', // Your website URL
    baseUrl: '/', // Base URL for your project */
    // For github.io type URLs, you would set the url and baseUrl like:
    //   url: 'https://facebook.github.io',
    //   baseUrl: '/test-site/',

    // Used for publishing and more
    projectName: 'simple-framework.github.io',
    organizationName: 'simple-framework',
    // For top-level user or org sites, the organization is still the same.
    // e.g., for the https://JoelMarcey.github.io site, it would be set like...
    //   organizationName: 'JoelMarcey'
    supportedServices: [
        {
            title: "HTCondor-CE",
            url: "",
            content: "HTCondor-CE",
            image: "/img/htcondor.png",
            imageAlign: "top"
        },
        {
            title: "HTCondor-Batch",
            url: "",
            content: "HTCondor Central Manager",
            image: "/img/htcondor.png",
            imageAlign: "top"
        },
        {
            title: "HTCondor-Worker",
            url: "",
            content: "HTCondor Execute Nodes",
            image: "/img/htcondor.png",
            imageAlign: "top"
        },
        // {
        //   title: "Cream-CE + Pbs Batch",
        //   url: "",
        //   content: "Cream Compute Element and Torque batch system in a single container",
        //   image: "/img/infn.png",
        //   imageAlign: "top"
        // },
        // {
        //   title: "Torque Worker Nodes",
        //   url: "",
        //   content: "Worker nodes based on Torque",
        //   image: "/img/pbs.png",
        //   imageAlign: "top"
        // },

    ],
    // For no header links in the top nav bar -> headerLinks: [],
    headerLinks: [
        {href: 'https://simple-framework-talk.web.cern.ch/', label: 'Discourse'},
        {doc: 'deployment_guide_htcondor', label: 'Docs'},
        {href: 'http://cern.ch/go/s7d7', label: 'Slack'},
        {href: 'https://github.com/simple-framework', label: 'GitHub'},
        {page: 'help', label: 'Help'},
        {blog: true, label: 'Blog'},

    ],
    algolia: {
        apiKey: 'my-api-key',
        indexName: 'my-index-name',
        algoliaOptions: {} // Optional, if provided by Algolia
    },

    // If you have users set above, you add it here:
    users,

    /* path to images for header/footer */
    headerIcon: 'img/SIMPLE_Logo.png',
    footerIcon: 'img/SIMPLE_Logo.png',
    favicon: 'img/SIMPLE_Logo.png',

    /* Colors for website */
    colors: {
        primaryColor: '#001884',
        secondaryColor: '#00105c',
    },

    /* Custom fonts for website */
    /*
    fonts: {
      myFont: [
        "Times New Roman",
        "Serif"
      ],
      myOtherFont: [
        "-apple-system",
        "system-ui"
      ]
    },
    */

    // This copyright info is used in /core/Footer.js and blog RSS/Atom feeds.
    copyright: `Copyright © ${new Date().getFullYear()} CERN`,

    highlight: {
        // Highlight.js theme to use for syntax highlighting in code blocks.
        theme: 'default',
    },

    // Add custom scripts here that would be placed in <script> tags.
    scripts: [
        'https://buttons.github.io/buttons.js',
        'https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js',
        '/js/code-block-buttons.js',
    ],
    stylesheets: ['/css/code-block-buttons.css'],
    // On page navigation for the current documentation page.
    onPageNav: 'separate',
    // No .html extensions for paths.
    cleanUrl: true,

    // Open Graph and Twitter card images.
    ogImage: 'img/undraw_online.svg',
    twitterImage: 'img/undraw_tweetstorm.svg',
    editUrl: 'https://github.com/simple-framework/simple_framework_website/edit/master/docs/',

    // For sites with a sizable amount of content, set collapsible to true.
    // Expand/collapse the links and subcategories under categories.
    // docsSideNavCollapsible: true,

    // Show documentation's last contributor's name.
    // enableUpdateBy: true,

    // Show documentation's last update time.
    // enableUpdateTime: true,

    // You may provide arbitrary config keys to be used as needed by your
    // template. For example, if you need your repo's URL...
    repoUrl: 'https://github.com/simple-framework/simple_grid_puppet_module',
};

module.exports = siteConfig;
