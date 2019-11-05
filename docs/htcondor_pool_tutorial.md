---
id: deployment_guide_htcondor
title: SIMPLE Framework Deployment Guide: HTCondor
sidebar_label: Deployment Guide: HTCondor
---

Terminal Captures: https://asciinema.org/~maany

A newer and more in depth version of this tutorial will be uploaded as we update the website. Please [reach out to us directly](../help) if you need more assistance and we would be happy to help you get started.

## Preparation of Nodes
1. Pick a config master node in your infrastructure. We will refer it as CM in the rest of the document. All the other nodes in your infrastructure on which you want to run grid services configured through the SIMPLE Grid framework are lightweight_component nodes of LC nodes.

1. Install puppetserver, puppet-agent (Puppet 5) on your CM node. For CentOS7 distributions, the commands would be:
    ```
    rpm -ivh https://yum.puppetlabs.com/puppet5/puppet5-release-el-7.noarch.rpm
    yum -y install puppetserver puppet-agent
    ```

1. Install puppet-agent (Puppet 5) on all of your LC nodes. For CC7, the commands are:
    ```
    rpm -ivh https://yum.puppetlabs.com/puppet5/puppet5-release-el-7.noarch.rpm
    yum install puppet-agent
    ```

## Installation of Central Configuration Manager i.e. Simple Grid Puppet Module

1. Download the [simple grid puppet module](https://forge.puppet.com/maany/simple_grid) on all of your nodes inside /etc/puppetlabs/code/environments/production/modules/
    
    ```
    puppet module install maany-simple_grid
    ```

Note: Once the module has been released on Puppet Forge, you can use ```puppet module install maany/simple-grid``` to automatically download and install the puppet module.

## Preparing a site level configuration file.

1. On the CM node, you can use the command below to generate a sample site level configuration file for you at /etc/simple_grid/site_config/site_level_configuration_file

    ```
    puppet apply -e 'class{"simple_grid::install::config_master::simple_installer::create_sample_site_level_config_file":}'
    
    ```

1. Edit the site level configuration file to describe your infrastructure and the components you want to deploy. We are working on a in-depth tutorial on how to write a site level config file. In the meantime, please reach out to us via any of the communication channels mentioned in the footer of the website to learn more.

## Simple Installer for CM
After writing the site level configuration file, run the simple installer on the CM node using to validate your site level confiuration file and install/configure various components of the SIMPLE framework on CM:
```
puppet apply --modulepath /etc/puppetlabs/code/environments/production/modules -e 'class{"simple_grid::install::config_master::simple_installer":}'
```
If there are errors related to the site level configuration file, please make the corrections and re-run the command until it executes successfully or get in touch with us to help debug the file.

## Simple Installer for LC's
On your LC nodes, you have to connect puppet agents to the puppet server running on the CM node. To do so and also configure the SIMPLE Grid Framework on the LC nodes, run the following command after replacing the 'fqdn of your CM node' with the correct fqdn of your CM node:

```
puppet apply --modulepath /etc/puppetlabs/code/environments/production/modules -e "class {'simple_grid::install::lightweight_component::simple_installer':puppet_master => 'fqdn of your CM node'}"
```

## Signing certificate requests from LC's on CM

On your CM node, see the certificate requests from LC's using:
 
```
puppet cert show -all
```

And sign the certificate requests from the LC nodes using

```
puppet cert sign --all
```

## Big Red button
Then on the CM node, to execute the pre_deploy stage of the framework, run
```
puppet agent -t
```
Continue to the deploy stage by repeating the command again.

```
puppet agent -t
```
