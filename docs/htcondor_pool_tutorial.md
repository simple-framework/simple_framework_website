---
id: deployment_guide_htcondor
title: SIMPLE Framework Deployment Guide: HTCondor
sidebar_label: Deployment Guide: HTCondor
---

# Installation

## Preparation of Nodes
1. Pick a config master node in your infrastructure. We will refer it as CM in the rest of the document. All the other nodes in your infrastructure on which you want to run grid services configured through the SIMPLE Grid framework are lightweight_component nodes of LC nodes.

1. Install puppetserver, puppet-agent, puppet-bolt ( Puppet 5 packages) on your CM node. For CentOS7 distributions, the commands would be:
```
rpm -ivh https://yum.puppetlabs.com/puppet5/puppet5-release-el-7.noarch.rpm
yum -y install puppetserver puppet-agent puppet-bolt
```

1. Install puppet-agent (Puppet 5) on all of your LC nodes. For CC7, the commands are:
```
rpm -ivh https://yum.puppetlabs.com/puppet5/puppet5-release-el-7.noarch.rpm
yum install puppet-agent
```
1. Make sure the packages openssh-server and openssh-clients are installed on your CM and LC machines

## Installation of Central Configuration Manager i.e. Simple Grid Puppet Module

1. Download the [simple grid puppet module]()on all of your nodes inside /etc/puppetlabs/code/environments/production/modules/

```
yum install -y wget unzip
wget -P /tmp/simple_grid https://github.com/WLCG-Lightweight-Sites/simple_grid_puppet_module/archive/master.zip
unzip /tmp/simple_grid/master.zip -d /tmp/simple_grid/
puppet module build /tmp/simple_grid/simple_grid_puppet_module-master/
puppet module install /tmp/simple_grid/simple_grid_puppet_module-master/pkg/maany-simple-0.1.0.tar.gz

```

Note: Once the module has been released on Puppet Forge, you can use ```puppet module install maany/simple-grid``` to automatically download and install the puppet module.

## Preparing a site level configuration file.

1. On the CM node, you can use the command below to generate a sample site level configuration file for you at /etc/simple_grid/site_config/site_level_configuration_file

**Remember to change simple module dir from simple to simple_grid** XXX
```
mv /etc/puppetlabs/code/environments/production/modules/simple /etc/puppetlabs/code/environments/production/modules/simple_grid
```
```
puppet apply -e 'class{"simple_grid::install::config_master::simple_installer::create_sample_site_level_config_file":}'

```
1. Edit the site level configuration file to describe your infrastructure and the components you want to deploy

## Simple Installer for CM
After writing the site level configuration file, run the simple installer on the CM node using to validate your site level confiuration file and install/configure various components of the SIMPLE framework on CM:

**Change /etc/puppetlabs/code/environments/production/modules/simple_grid/data/common.yaml to release:** XXX
```
simple_grid::mode: "%{hiera('simple_grid::mode::release')}"
```
Then...
```
puppet apply --modulepath /etc/puppetlabs/code/environments/production/modules -e 'class{"simple_grid::install::config_master::simple_installer":}'

```

**Errors related to puppet forge as expected, since the module isn't on the forge** XXX
"
Error: 'puppet module install maany-simple_grid --version 1.0.0 --environment simple' returned 1 instead of one of [0]
Error: /Stage[main]/Simple_grid::Components::Ccm::Install/Exec[Installing Simple Grid Puppet Module from Puppet Forge]/returns: change from 'notrun' to ['0'] failed: 'puppet module install maany-simple_grid --version 1.0.0 --environment simple' returned 1 instead of one of [0]
"

If there are errors related to the site level configuration file, please make the corrections and re-run the command until it executes successfully.

## Simple Installer for LC's
On your LC nodes, you have to connect puppet agents to the puppet server running on the CM node. To do so and also configure the SIMPLE Grid Framework on the LC nodes, run the following command after replacing the 'fqdn of your CM node' with the correct fqdn of your CM node:

**Remember to change simple module dir from simple to simple_grid** XXX
```
mv /etc/puppetlabs/code/environments/production/modules/simple /etc/puppetlabs/code/environments/production/modules/simple_grid
```
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
Wait for 5 minutes to let the LC's automatically complete their configuration by connecting to the CM node.
Then on the CM node, to execute the pre_deploy stage of the framework, run
```
puppet agent -t
```
