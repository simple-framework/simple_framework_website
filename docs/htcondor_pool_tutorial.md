---
id: deployment_guide_htcondor
title: SIMPLE Framework Deployment Guide: HTCondor
sidebar_label: Deployment Guide: HTCondor
---
## Quick Introduction

This tutorial describes setting up a production ready [HTCondor](https://research.cs.wisc.edu/htcondor/) cluster using the SIMPLE Framework.
The instructions below use some Puppet commands but they do not require any previous experience with Puppet. 

We are rapidly taking feedback from the site admins and rolling out updated versions of the framework's components. To stay in loop, 
please watch out for the 'announcements' channel in 
[Slack](https://join.slack.com/t/simple-framework/shared_invite/enQtODE4NzY2MTk2OTY0LWZmNjQ0NThmNDRiMzc1YTUxMzU3MTNjOGU4YWRlN2E0MzI5NjQ3ZDNjMDkxYjYzMjdkZGQyNzJjNmMwNzlmNWY)
while we put together a Discourse forum. Please also bookmark the homepage as we plan to announce the Discourse forum there.

### Target Audience
The target audience for this tutorial are WLCG Site admins who wish to :
1. Try out the SIMPLE framework, a private PaaS that can deploy WLCG services on demand at their site.
1. Migrate to HTCondor from existing CREAM-CE based WLCG infrastructure at their sites. 
1. Quickly set up a test HTCondor cluster on a few nodes of their infrastructure that can subsequently be used to
   get familiar with HTCondor before they perform a full-scale migration to HTCondor.

### Overview of the Tutorial
In this tutorial, we will :
1. Select at least 4 machines (bare-metal/VM) in your infrastructure on which the SIMPLE framework and HTCondor will be set up. 
   We will refer to these as your **SIMPLE cluster** in the remainder of this tutorial
1. Prepare your SIMPLE cluster to work with the [simple_grid_puppet_module](https://forge.puppet.com/maany/simple_grid). 
1. Create a site_level_config_file.yaml (a YAML file similar to site-info.def if you are familiar with 
   [YAIM](https://twiki.cern.ch/twiki/bin/view/LCG/YaimGuide400)) that describes your SIMPLE cluster and the 
   HTCondor-CE, HTCondor-Batch(Central Manager) and HTCondor-Worker(Execute) configuration.
1. Execute the SIMPLE framework's config, pre_deploy and deploy stages to setup HTCondor on your SIMPLE cluster.
1. Run few HTCondor commands to evaluate the status of your cluster.

### Additional Notes

1. We are a fast-paced development community and are constantly adding new features to the framework. Therefore, please 
   feel free to check this tutorial for updates that can be useful for your future deployments.
1. Please do [get in touch](../help) with us in case any step is not clear or needs clarification. 
   We will try to maintain a Known Issues and FAQ section at the end of this tutorial that can be useful for 
   fellow site-admins who try to deploy HTCondor with SIMPLE at their sites.
1. We are always keen to get your feedback/suggestions/bug reports and feature requests. You can report them on any 
   of the [communication channels](../help)

Let's begin!

## SIMPLE cluster

The very first thing you must do is to select **at least 4 CC7 machines** at your data center where you would like 
to deploy the HTCondor cluster. One of these machines is going to serve as the **Config Master** node, while 
remainder serve as **Lightweight Component** nodes.

**Config Master or CM** and **Lightweight Component or LC** are commonly used terminologies in the SIMPLE framework. 
The Lightweight Component nodes are where lightweight components i.e. containerized grid services, HTCondor in this case, 
are deployed. The Config Master is a single node in the SIMPLE cluster that manages the deployment of the 
lightweight components i.e. containerized grid services on your Lightweight Component nodes.

**Note**: In the remainder of this tutorial **we will refer to Config Master as CM and Lightweight Components as LC**.

One of your LC nodes is going to run the HTCondor-CE, another one of your LC nodes will run the HTCondor Batch 
while the rest of your LC nodes are going to run HTCondor Workers. The criterion for selecting nodes for each type of 
service is listed in the next subsection below.

**Note** : It is possible to deploy HTCondor Submitters to **support the local users with SIMPLE** as well. If you foresee this use-case,
please [get in touch](../help) to learn more about it. We are still developing/testing this use case with our early adopters. 
Will be rolling out the official instructions for local user support soon. In the meantime, we are happy to provide you details
on what we have and collaborate to tailor the local users use-case as per your requirements. 


### Hardware Specifications

You might be able to operate slightly below the requirements mentioned below. 
In the example, for instance, our OpenStack nodes do not exactly meet the recommended hardware specifications. 
However, since it is just a test cluster, we are able to demonstrate the framework with the slightly less powerful resources. 
In real production examples, we recommend that you ensure your nodes meet the recommended requirements. 
It is difficult to predict the performance of the system otherwise.

#### For small or test HTCondor SIMPLE cluster (~ 10 nodes)
The recommended requirements for the CM and LC nodes for your HTCondor SIMPLE cluster are as follows:

| Node Type | HTCondor Role   | # CPU Cores | RAM(GB)                                  | Swap(GB) | Disk(GB) -  Root Filesystem                |
|-----------|-----------------|-------------|------------------------------------------|----------|--------------------------------------------|
| CM        | N/A             | 2           | 2*#cores (puppetserver)                  | 1        | 12(image) + 1(puppetserver)                |
| LC        | HTCondor CE     | 1           | 2(swarm) + 0.5(HTCondor) + 1 (misc)      | 1        | 3(docker) + 5(image)                       |
| LC        | HTCondor Batch  | 1           | 2(swarm) + 0.1(HTCondor) + 1 (misc)      | 1        | 3(docker) + 5(image)                       |
| LC        | HTCondor Worker | 1           | 2(swarm) + 2*#cores(HTCondor) + 1 (misc) | 3*#cores | 3(docker) + 5(image) + 10*#cores(HTCondor) |

#### For larger (>10 nodes) or production HTCondor SIMPLE Cluster

| Node Type | HTCondor Role   | # CPU Cores | RAM(GB)                                  | Swap(GB) | Disk(GB) - Root Filesystem                 |
|-----------|-----------------|-------------|------------------------------------------|----------|--------------------------------------------|
| CM        | N/A             | 4           | 2*#cores (puppetserver) + 2(misc)        | 2        | 12(image) + 2(puppetserver)                |
| LC        | HTCondor CE     | 1           | 8(swarm) + 0.5(HTCondor) + 1 (misc)      | 1        | 3(docker) + 5(image)                       |
| LC        | HTCondor Batch  | 1           | 8(swarm) + 0.1(HTCondor) + 1 (misc)      | 1        | 3(docker) + 5(image)                       |
| LC        | HTCondor Worker | 8           | 8(swarm) + 2*#cores(HTCondor) + 1 (misc) | 3*#cores | 3(docker) + 5(image) + 10*#cores(HTCondor) |

#### Specs for Example HTCondor SIMPLE cluster on CERN OpenStack

**Note**: The following cluster will be referred to as the **example cluster** in the rest of this tutorial. The terminal captures that we include 
in this tutorial will be from the example cluster.

| Node Type | FQDN                     | IP address      | HTCondor Role | #cores | RAM(GB) | Swap(GB) | Disk(GB) - Root Filesystem |
|-----------|--------------------------|-----------------|---------------|--------|---------|----------|----------------------------|
| CM        | simple-condor-cm.cern.ch | 137.138.53.69   | N/A           | 2      | 4       | 1        | 20                         |
| LC        | simple-lc-node0.cern.ch  | 188.185.115.228 | CE            | 2      | 4       | 1        | 20                         |
| LC        | simple-lc-node1.cern.ch  | 188.185.118.59  | Batch         | 2      | 4       | 1        | 20                         |
| LC        | simple-lc-node2.cern.ch  | 188.185.112.73  | WN            | 4      | 8       | 12       | 60                         |
| LC        | simple-lc-node3.cern.ch  | 188.185.78.0    | WN            | 4      | 8       | 12       | 60                         |



### Pre-Requisites

#### Host Certificates
For your HTCondorCE to work, you will have to pre-arrange **host certificates (hostkey.pem and hostcert.pem)** from a trusted CA for your HTCondorCE LC node.
On your CM, you will then create the following directory:

**Note**: The following commands are executed on the CM

```shell session
mkdir -p /etc/simple_grid/host_certificates/$fqdn_of_you_ce
``` 
In our example SIMPLE cluster, the HTCondorCE node is simple-lc-node0.cern.ch. Therefore, the above command would look as follows:
```shell script
mkdir -p /etc/simple_grid/host_certificates/simple-lc-node0.cern.ch
```
Inside this newly created directory, place the hostkey.pem and hostcert.pem for your CE. 
You can optionally change the permissions on your hostkey.pem and hostcert.pem as follows

```shell script
chmod 755 /etc/simple_grid/host_certificates/$fqdn_of_your_ce
chmod 600 /etc/simple_grid/host_certificates/$fqdn_of_your_ce/hostkey.pem
chmod 644 /etc/simple_grid/host_certificates/$fqdn_of_your_ce/hostcert.pem
```

In your example cluster, the above commands would look like:
```shell script
chmod 755 /etc/simple_grid/host_certificates/simple-lc-node0.cern.ch
chmod 600 /etc/simple_grid/host_certificates/simple-lc-node0.cern.ch/hostkey.pem
chmod 644 /etc/simple_grid/host_certificates/simple-lc-node0.cern.ch/hostcert.pem
```

Your host_certificates directory would finally resemble the following:

```shell session
$ ls -la /etc/simple_grid/host_certificates/simple-lc-node0.cern.ch/
total 8
drwxr-xr-x 2 root root   45 Jan 23 15:12 .
drwxr-xr-x 4 root root   69 Jan 23 15:12 ..
-rw-r--r-- 1 root root 3060 Jan 23 15:12 hostcert.pem
-rw------- 1 root root 1828 Jan 23 15:12 hostkey.pem
```

#### CVMFS proxy
For the HTCondor Workers to run production jobs from the grid, you must have a local CVMFS Squid proxy(an easy to configure 
Squid forward proxy server) configured and running at your site. 
If you are migrating from CREAM-CE, it is likely that you already have a local CVMFS Squid proxy running locally at your site. 
If so, you can just re-use that for your HTCondor SIMPLE cluster. If not, please set up a CVMFS Squid proxy server on 
a node that does not belong to the SIMPLE cluster.
If you support Atlas or CMS, you'll have to setup a [Frontier Squid server](https://twiki.cern.ch/twiki/bin/view/Frontier/InstallSquid). 
If not, then a regular Squid must be configured as described [here](http://cernvm.web.cern.ch/portal/cvmfs/examples).

#### SELinux
After you have identified a CM node and appropriate LC nodes, you must ensure that SELinux is disabled on the nodes. 
If you prefer to have SELinux enabled, please [get in touch](../help) and we can help figure out the SELinux policy 
required by Docker and Puppet to function correctly. Otherwise, edit /etc/selinux/config and set SELINUX=disabled. 
Then, reboot your machine and make sure that output of the command ```sestatus``` is disabled. 

For instance, in our example, on one of the LC nodes: 
```shell script
sestatus
```
The output should be:
```
SELinux status:                 disabled
```

#### Network and DNS settings
Please check the DNS settings and /etc/hosts files to make sure all of the nodes in the SIMPLE cluster can reach 
each other over the network available at your site.
In previous deployment instances, we have encountered situations where the deployment process would fail due to 
misconfiguration of network for the nodes in the SIMPLE cluster.

## Simple CLI
The Simple CLI enables you to interact with the framework and with your SIMPLE cluster in a very user-friendly way. It executes
the different stages during your deployment, performs validation checks on your infrastructure, informs you if anything 
goes wrong and organizes stdout, stderr from the commands issued by it.

You can install the Simple CLI on your CM via:
```shell script
curl https://raw.githubusercontent.com/simple-framework/simple_bash_cli/current/simple --output ~/simple
chmod +x ~/simple
alias simple=~/simple
cd ~
```

As an optional step, you can create an alias for the script in your ~/.bashrc file in case you'd like to access the script 
more conveniently in the future.

```shell script
echo "alias simple=~/simple" >> ~/.bashrc
```
**Note**: The CLI generates its logs at */var/log/simple*

**Note**: In the remainder of the tutorial we will use the Simple CLI functions to deploy the HTCondor Cluster.
 
## Pre-install the CM
Install puppetserver, puppet-agent and our Puppet module on your **CM node**. Using the **simple** CLI, the command is:

```shell script
simple pre-install-cm
```

If the command does not exit with code 0, its logs would provide clues on how to resolve issues that were encountered.

## Preparing a site level configuration file.

The site level configuration file is a YAML file where you describe your infrastructure and the lightweight components
you wish to deploy on your infrastructure along with additional information related to VOs and quotas etc.
The site level config is like a site-info.def file from the [YAIM](https://twiki.cern.ch/twiki/bin/view/LCG/YaimGuide400) 
realm. It is the only configuration file you need to instruct the framework on how it should set-up and configure the 
grid services on your infrastructure.

The framework provides a lot of features that can simplify and significantly reduce the size of the site level configuration file.
Generally 100-200 lines are enough to deploy very large clusters.
The discussion of these features(variable declaration, splitting of configuration into smaller config files, script injection, 
injection of additional config variables for grid services, ...) is out of scope for this tutorial. We are working on a detailed
guide on writing site level configuration files.

**Note**: The CM node is not specified in the site level configuration file. The site level configuration
file is hosted on the CM node and specifies what grid services should be deployed on the LC nodes, which are explicitly 
specified in the file.

Here is what the site level configuration file for our example cluster looks like:
```yaml
### url of schema
schema:  "https://raw.githubusercontent.com/WLCG-Lightweight-Sites/simple_grid_site_repo/master/simple_base_schema.yaml"

### Variable declaration:
global_variables:
  - &ce_host_ip 188.185.115.228
  - &ce_host_fqdn simple-lc-node0.cern.ch
  - &batch_host_ip 188.185.118.59
  - &batch_host_fqdn simple-lc-node1.cern.ch
  - &wn1_host_ip 188.185.112.73
  - &wn1_host_fqdn simple-lc-node2.cern.ch
  - &wn2_host_ip 188.185.78.0
  - &wn2_host_fqdn simple-lc-node3.cern.ch

htcondor_ce_runtime_variables:
  - &htcondor_ce_runtime_var_ce_host simple-lc-node0.cern.ch

htcondor_batch_runtime_variables:
  - &htcondor_runtime_var_batch_host simple-lc-node1.cern.ch

site:
  name: 'OpenStack SIMPLE dev cluster'
  email: 'admin@my-host.my-domain'
  latitude: 46.3
  longitude: 6.2
  location: CERN
  description: 'CERN WLCG Grid by SIMPLE at CERN Openstack'
  website: 'https://home.cern'
  support_website: 'https://groups.google.com/forum/#!forum/wlcg-lightweight-sites'
  support_email: 'admin@my-host.my-domain'
  security_email: 'admin@my-host.my-domain'
  grid: 'wlcg' #site_other_grid: str(), wlcg, egi,osg
  tier: 3
  bdii_host: bdii.cern.ch
  cvmfs_http_proxy_list:
    - "http://ca-proxy.cern.ch:3128"
  use_argus: no
  timezone: CET


preferred_tech_stack:
  level_1_configuration: puppet
  level_2_configuration: sh
  container_orchestration: docker-swarm
  container: docker

site_infrastructure:
  - fqdn: *ce_host_fqdn
    ip_address: *ce_host_ip
  - fqdn: *batch_host_fqdn
    ip_address: *batch_host_ip
  - fqdn: *wn1_host_fqdn
    ip_address: *wn1_host_ip
  - fqdn: *wn2_host_fqdn
    ip_address: *wn2_host_ip



lightweight_components:
  - type: compute_element
    name: HTCondor-CE
    repository_url: "https://github.com/simple-framework/simple_htcondor_ce"
    repository_revision: "master"
    execution_id: 0
    lifecycle_hooks:
      pre_config: []
      pre_init: []
      post_init: []
    deploy:
      - node: *ce_host_fqdn
        container_count: 1
    preferred_tech_stack:
      level_2_configuration: sh
    config:
      condor_host_execution_id: 1
    supplemental_config:
      #Example of adding HTCondorCE configuration knobs through the site level configuration file.
      'htcondor-ce':
        - "MYVAR=VALUE"
        - ANOTHER_CONDOR_KNOB: VALUE
      'htcondor':
        - "MYVAR=VALUE" #Example of adding HTCondor configuration knobs through the site level configuration file.
      '/etc/hosts':
        - "10.0.1.100 apel-host.mysite"

  - type: batch_system
    name: HTCondor-Batch
    repository_url: "https://github.com/simple-framework/simple_htcondor_batch"
    repository_revision: "master"
    execution_id: 1
    lifecycle_hooks:
      pre_config: []
      pre_init: []
      post_init: []
    deploy:
      - node: *batch_host_fqdn
        container_count: 1
    preferred_tech_stack:
      level_2_configuration: sh
    config:
      placeholder_param: some_value
    supplemental_config:
      'htcondor':
        - "MYVAR=VALUE" #Example of adding HTCondor configuration knobs through the site level configuration file.
      '/etc/hosts':
        - "10.0.1.100 apel-host.mysite"

  - type: worker_node
    name: HTCondor-Worker
    repository_url: "https://github.com/simple-framework/simple_htcondor_worker"
    repository_revision: "master"
    execution_id: 2
    lifecycle_hooks:
      pre_config: []
      pre_init: []
      post_init: []
    deploy:
      - node: *wn1_host_fqdn
        container_count: 1
      - node: *wn2_host_fqdn
        container_count: 1
    preferred_tech_stack:
      level_2_configuration: sh
    config:
      condor_host_execution_id: 1
      num_slots: 4
    # Creating or appending content to new/existing files inside containers through supplemental_config section
    supplemental_config:
      "/some_path_in_container": 
        - "contents to be appended" 

supported_virtual_organizations:
  - *default_vo_alice
  - *default_vo_dteam
  - *default_vo_ops

voms_config:
  - voms_fqan: '/alice'
    pool_accounts:
      - *default_pool_accounts_alice
    vo: *default_vo_alice
  - voms_fqan: '/alice/ROLE=lcgadmin'
    pool_accounts:
      - *default_pool_accounts_alice
      - *default_pool_accounts_alicesgm
    vo: *default_vo_alice
    comment: sgm
  - voms_fqan: '/dteam'
    # An example of overriding default variable's initial_uid field. The default variables is declared at:
    # https://github.com/simple-framework/simple_grid_site_repo/blob/master/site_level_configuration_defaults.yaml
    pool_accounts:
      - <<: *default_pool_accounts_dteam
        initial_uid: 20020
    vo: *default_vo_dteam
  - voms_fqan: '/dteam/ROLE=lcgadmin'
    pool_accounts:
      - *default_pool_accounts_dteamsgm
      - *default_pool_accounts_dteam
    vo: *default_vo_dteam
    comment: sgm
  - voms_fqan: '/ops'
    vo: *default_vo_ops
    pool_accounts:
      - *default_pool_accounts_ops
  - voms_fqan: '/ops/ROLE=lcgadmin'
    pool_accounts:
      - *default_pool_accounts_opssgm
      - *default_pool_accounts_ops
    vo: *default_vo_ops
    comment: sgm
```

The site level configuration file is compiled by the [simple_grid_yaml_compiler](https://github.com/simple-framework/simple_grid_yaml_compiler).
It is essential to ensure that your site level configuration file can be successfully compiled by it.

At present, to ensure you can compile your site level configuration file, you can:
1. [Get in touch](../help) with us directly and we will help compile and fix any errors in the site level configuration file.
1. Set up [compiler](https://github.com/simple-framework/simple_grid_yaml_compiler) as described towards the end of this section
and run it with your site level configuration file as the input.

To simplify the process, we are working on a web based compiler, which should be available soon.

Below, we mention the instructions that should be sufficient to write a sensible site level configuration file.

First off, the framework can significantly assist you in writing your site level config file by generating 
a **template** for your HTCondor installation.

To do so, on the CM node, you can use the command below to generate a sample site level configuration file that you can modify 
for your installation. The sample HTCondor site_level_config_file.yaml will be put directly at its default location
**/etc/simple_grid/site_config/site_level_config_file.yaml** and **overwrite** whatever was there before:

```shell script
simple create-template
```

Modify the file according to the planned layout of your (test) cluster as described below: 
and make a **backup** of the result in a safe place: 

```shell script
vim /etc/simple_grid/site_config/site_level_config_file.yaml
```
```shell script
cp -i /etc/simple_grid/site_config/site_level_config_file.yaml ~/my-site-config-$$.yaml
```

You will see that the configuration file has the following distinct sections:
1. [schema](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L1)
1. [global_variables](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L4)
1. [runtime_variables](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L12-L16)
1. [site](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L18)
1. [preferred_tech_stack](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L38)
1. [site_infrastructure](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L44)
1. [lightweight_components](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L52)
1. [supported_virtual_organizations](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L108)
1. [voms_config](https://github.com/simple-framework/simple_grid_puppet_module/blob/production/templates/htcondor_sample_site_level_config_file.yaml.epp#L113)

### schema
This field can be left untouched. It instructs the compiler to use the following 
[schema](https://raw.githubusercontent.com/WLCG-Lightweight-Sites/simple_grid_site_repo/master/simple_base_schema.yaml) 
when compiling your site level configuration file.

### global_variables
The global variables sections is where you declare variables that can be re-used throughout your
site level configuration file.
To declare a new variable involves add an entry under the global variables section.
In the sample site level configuration file, you will see that we already have some variables declared:

```yaml
### Variable declaration:
global_variables:
  - &ce_ip 188.184.104.25
  - &ce_fqdn simple-lc01.cern.ch
  - &batch_ip 188.184.30.19
  - &batch_fqdn simple-lc02.cern.ch
  - &wn1_ip 188.184.84.189
  - &wn1_fqdn simple-lc03.cern.ch
  - &wn2_ip 188.184.84.190
  - &wn2_fqdn simple-lc04.cern.ch
```
To add a new variable, you can just create a new entry under the global_variables section. The new entry 
would have the following format:

```yaml
global_variables:
  - ..
  - ..
  - &new_variable_name value_of_the_variable
```

Let's create 2 new variables called htcondor_wn3_host_ip_address and htcondor_wn3_host_fqdn.
```yaml
global_variables:
  - &ce_ip 188.184.104.25
  - &ce_fqdn simple-lc01.cern.ch
  - &batch_ip 188.184.30.19
  - &batch_fqdn simple-lc02.cern.ch
  - &batch_fqdn simple-lc02.cern.ch
  - &wn1_ip 188.184.84.189
  - &wn1_fqdn simple-lc03.cern.ch
  - &wn2_ip 188.184.84.190
  - &wn2_fqdn simple-lc04.cern.ch
  - &htcondor_wn3_host_ip_address 188.185.115.228
  - &htcondor_wn3_host_fqdn simple-lc-node0.cern.ch
```   

We recommend creating a variable for the fqdn and ip address of each LC node and then re-using them throughout the site level configuration wherever required. 

For our example cluster, the global_variables section will look as follows:
```yaml
global_variables:
  - &ce_host_ip 188.185.115.228
  - &ce_host_fqdn simple-lc-node0.cern.ch
  - &batch_host_ip 188.185.118.59
  - &batch_host_fqdn simple-lc-node1.cern.ch
  - &wn1_host_ip 188.185.112.73
  - &wn1_host_fqdn simple-lc-node2.cern.ch
  - &wn2_host_ip 188.185.78.0
  - &wn2_host_fqdn simple-lc-node3.cern.ch
```

### runtime_variables
The runtime variables are an advanced feature of the framework. They enable grid experts who add support for grid services through SIMPLE 
to request some additional information from site admins that is required for configuring the grid services.

It is necessary to provide a value to these variables to ensure that the containerized services can get configured properly.
For the HTCondor SIMPLE cluster, we need two runtime_variables, namely, 

- **htcondor_ce_runtime_var_ce_host** : The FQDN of the LC node where you wish to deploy HTCondorCE
- **htcondor_batch_runtime_var_batch_host**: The FQDN of LC node where you wish to deploy HTCondorBatch

**Note**: In runtime variables, the values of global_variables cannot be used, at present.

In our example, these sections look as follows:
```yaml
htcondor_ce_runtime_variables:
  - &htcondor_ce_runtime_var_ce_host simple-lc-node0.cern.ch

htcondor_batch_runtime_variables:
  - &htcondor_runtime_var_batch_host simple-lc-node1.cern.ch
```

Modify your site level configuration file to add/update the *htcondor_ce_runtime_variables* section and assign 
the *&htcondor_ce_runtime_var_ce_host* variable to point to your HTCondorCE LC host.


Then add/update the *htcondor_batch_runtime_variables* section in your site level configuration and assign the value 
of *&htcondor_runtime_var_batch_host* to point to your HTCondor Batch LC host.

### site

The site section contains generic information about your site like name, location, website, timezone, ... . 

For the test cluster you set up, you **may** update any or all of the fields based on your site. 
However, you **must** set the **timezone** field. Find your timezone relative to the **/usr/share/zoneinfo**
directory and put the relative path as the value for the timezone field in the site section.

You must also specify the CVMFS squid/s that should be used by the HTCondor-Workers in the **cvmfs_http_proxy_list** 
field, as shown.

For the example cluster, the site section looks as follows:
```yaml
site:
  name: 'OpenStack SIMPLE dev cluster'
  email: 'admin@my-host.my-domain'
  latitude: 46.3
  longitude: 6.2
  location: CERN, Geneva, Switzerland
  description: 'CERN HTCondor cluster by SIMPLE @ CERN Openstack'
  website: 'https://home.cern'
  support_website: 'https://groups.google.com/forum/#!forum/wlcg-lightweight-sites'
  support_email: 'admin@my-host.my-domain'
  security_email: 'admin@my-host.my-domain'
  grid: 'wlcg'
  tier: 3
  bdii_host: bdii.cern.ch
  cvmfs_http_proxy_list:
    - "http://ca-proxy.cern.ch:3128"
  use_argus: no
  timezone: CET
```

### preferred_tech_stack
SIMPLE framework, by design, can be implemented in various popular tools for configuration management, container orchestration, etc.

This section describes the set of technologies the framework should use to configure the LC hosts and HTCondor containers. 

For now, the section can remain unchanged, as the supported technologies do not have any alternatives.

For our example and for your SIMPLE cluster, this section would look as follows:

```yaml
preferred_tech_stack:
  level_1_configuration: puppet
  level_2_configuration: sh
  container_orchestration: docker-swarm
  container: docker
```

### site_infrastructure
In this section, you tell the framework about how to access the LC hosts. If any of your LC hosts have **multiple network interfaces**,
please use the IP address that corresponds to the interface that can access all the other LC hosts in your network.

For each LC host, you need to make an entry that consists of its fqdn and IPv4 address.
For instance, the YAML object for a node simple-lc-node0.cern.ch with IPv4 address 188.184.104.25 would look as follows:
```yaml
site_infrastructure:
  - fqdn: simple-lc-node0.cern.ch
    ip_address: 188.184.104.25
```

If in the global variables section, if there already exists is an entry for the FQDN and IP addresses of your LC nodes,
we could directly use the values of these variables.
Let's say lightweight_component01_fqdn corresponds to simple-lc-node0.cern.ch, while lightweight_component01_ip_address 
corresponds to 188.184.104.25, then the above section can be re-written as:

```yaml
site_infrastructure:
  - fqdn: *ce_host_fqdn
    ip_address: *ce_host_ip
```
For our example cluster, where we have already declared variables for the IP Addresses and FQDNs for each of our LC hosts,
this section looks as follows:

```yaml
site_infrastructure:
  - fqdn: *ce_host_fqdn
    ip_address: *ce_host_ip
  - fqdn: *batch_host_fqdn
    ip_address: *batch_host_ip
  - fqdn: *wn1_host_fqdn
    ip_address: *wn1_host_ip
  - fqdn: *wn2_host_fqdn
    ip_address: *wn2_host_ip
```

### lightweight_components
In this section you tell the framework about the configuration of the grid services that should be deployed on the LC hosts, 
specified in the site_infrastructure section. For the SIMPLE HTCondor cluster, these services are the HTCondor-CE, 
HTCondor-Batch and HTCondor-Workers. 

The following YAML code describes our example HTCondor cluster. You can use it as-is for your own SIMPLE HTCondor cluster 
after applying the modifications mentioned below:

```yaml
llightweight_components:
   - type: compute_element
     name: HTCondor-CE
     repository_url: "https://github.com/simple-framework/simple_htcondor_ce"
     repository_revision: "master"
     execution_id: 0
     lifecycle_hooks:
       pre_config: []
       pre_init: []
       post_init: []
     deploy:
       - node: *ce_host_fqdn
         container_count: 1
     preferred_tech_stack:
       level_2_configuration: sh
     config:
       condor_host_execution_id: 1
     supplemental_config:
       #Example of adding HTCondorCE configuration knobs through the site level configuration file.
       'htcondor-ce':
         - "MYVAR=VALUE"
         - ANOTHER_CONDOR_KNOB: VALUE
       'htcondor':
         - "MYVAR=VALUE" #Example of adding HTCondor configuration knobs through the site level configuration file.
       '/etc/hosts':
         - "10.0.1.100 apel-host.mysite"
 
   - type: batch_system
     name: HTCondor-Batch
     repository_url: "https://github.com/simple-framework/simple_htcondor_batch"
     repository_revision: "master"
     execution_id: 1
     lifecycle_hooks:
       pre_config: []
       pre_init: []
       post_init: []
     deploy:
       - node: *batch_host_fqdn
         container_count: 1
     preferred_tech_stack:
       level_2_configuration: sh
     config:
       placeholder_param: some_value
     supplemental_config:
       'htcondor':
         - "MYVAR=VALUE" #Example of adding HTCondor configuration knobs through the site level configuration file.
       '/etc/hosts':
         - "10.0.1.100 apel-host.mysite"
 
   - type: worker_node
     name: HTCondor-Worker
     repository_url: "https://github.com/simple-framework/simple_htcondor_worker"
     repository_revision: "master"
     execution_id: 2
     lifecycle_hooks:
       pre_config: []
       pre_init: []
       post_init: []
     deploy:
       - node: *wn1_host_fqdn
         container_count: 1
       - node: *wn2_host_fqdn
         container_count: 1
     preferred_tech_stack:
       level_2_configuration: sh
     config:
       condor_host_execution_id: 1
       num_slots: 4
     # Creating or appending content to new/existing files inside containers through supplemental_config section
     supplemental_config:
       "/some_path_in_container": 
         - "contents to be appended" 

```
For each of HTCondor-CE, HTCondor-Batch and HTCondor-Worker, please modify the **node field** of the **deploy sections** to point to 
the corresponding LC node/s in you cluster.

In the config section of the HTCondor-Worker, please adjust the **num_slots** parameter to a number less than or 
equal to the number of cores available on the LC host/s where you wish to deploy the HTCondor-Worker. 

For the purpose of the the test cluster, you may leave everything else in the lightweight_components section unchanged.
It is possible to fine-tune the HTCondor configuration directly from the lightweight_components section. 
We will create a detailed document describing how to do so. Please [talk to us](../help) to learn more about these.
 
In the meantime, here's a quick note on the advanced configuration fields/sub-sections of a lightweight component:

- **execution_id**: This field controls the order in which grid services are deployed. Lower execution ids are executed the earliest.

- **lifecycle_hooks**: The lifecycle_hooks section enables you to inject custom shell scripts to customize the deployment of grid services. 

- **supplemental_config**: The supplemental config section enables you to inject custom condor configuration knobs directly in the HTCondor configuration files.
You can also use the supplemental config section to modify any other file inside of the grid service containers. 
For instance, you could modify the /etc/hosts to add DNS info for your local site services.

- **preferred_tech_stack**: The preferred_tech_stack section can be used to control the configuration management technology used to configure HTCondor 
inside of the containers. At present, the only supported configuration technology is *shell*, hence the value of level_2_configuration is *sh*.

- **repository_url**: The GitHub URL of a lightweight component repository, or simply a component repository. It contains the HTCondor containers and configuration code that will run
on your infrastructure.

- **repository_revision**: The branch/tag on GitHub determining the  component repository version. 

- **config**: This section is where you provide values for variables mentioned in the config-schema.yaml files present 
at the root of the corresponding component repositories. You can access the config-schema.yaml files for 
[HTCondor-CE](https://github.com/simple-framework/simple_htcondor_ce/blob/master/config-schema.yaml),
[HTCondor-Batch](https://github.com/simple-framework/simple_htcondor_batch/blob/master/config-schema.yaml) and
[HTCondor-Worker](https://github.com/simple-framework/simple_htcondor_worker/blob/master/config-schema.yaml).

### supported_virtual_organizations
Here you tell the framework about the VOs that your site supports. The framework provides **default VO Configuration 
for all four LHC VOs, dteam and ops**. The default variables that you can use in your site level configuration file
can be seen in the site_level_configuration_defaults.yaml file present 
[here](https://github.com/simple-framework/simple_grid_site_repo/blob/master/site_level_configuration_defaults.yaml).

To support Atlas and Alice in your site, 
```yaml
supported_virtual_organizations:
- *default_vo_atlas
- *default_vo_alice
```

In our example cluster, we support Alice, Ops and Dteam VOs, therefore the supported_virtual_organizations section looks as follows:
```yaml
supported_virtual_organizations:
  - *default_vo_alice
  - *default_vo_dteam
  - *default_vo_ops
```

### voms_config
This section describes the VOMS FQANs to pool accounts mapping that the framework should configure for relevant grid services.
For our example cluster, this section looks as follows:
```yaml
voms_config:
  - voms_fqan: '/alice'
    pool_accounts:
      - *default_pool_accounts_alice
    vo: *default_vo_alice
  - voms_fqan: '/alice/ROLE=lcgadmin'
    pool_accounts:
      - *default_pool_accounts_alice
      - *default_pool_accounts_alicesgm
    vo: *default_vo_alice
    comment: sgm
  - voms_fqan: '/dteam'
    # An example of overriding default variable's initial_uid field. The default variables is declared at:
    # https://github.com/simple-framework/simple_grid_site_repo/blob/master/site_level_configuration_defaults.yaml
    pool_accounts:
      - <<: *default_pool_accounts_dteam
        initial_uid: 20020
    vo: *default_vo_dteam
  - voms_fqan: '/dteam/ROLE=lcgadmin'
    pool_accounts:
      - *default_pool_accounts_dteamsgm
      - *default_pool_accounts_dteam
    vo: *default_vo_dteam
    comment: sgm
  - voms_fqan: '/ops'
    vo: *default_vo_ops
    pool_accounts:
      - *default_pool_accounts_ops
  - voms_fqan: '/ops/ROLE=lcgadmin'
    pool_accounts:
      - *default_pool_accounts_opssgm
      - *default_pool_accounts_ops
    vo: *default_vo_ops
    comment: sgm
```

Please modify this section accordingly, based on the VOs you support, in your own site level configuration file. 
The default variables for all four LHC VOs, DTeam and Ops that you can use can be seen in 
[this file](https://github.com/simple-framework/simple_grid_site_repo/blob/master/site_level_configuration_defaults.yaml).

## Pre-Compilation
You now must pre-compile your site level configuration file, in particular to spot and fix any errors early in
the deployment process.

While are working on a web-based compiler to significantly simplify writing of the site level configuration files, you can 
use the commands shown below to locally test the compilation of your site level configuration file in the meantime.

```shell script
simple pre-compile
```
If the compiler runs without any errors (i.e. the exit code is 0), you can proceed with the deployment. If there are errors, please take a look
at the troubleshooting guide towards the end of this tutorial or [get in touch](../help) with us for further assistance.

## Extract the LC hosts
Next you will run the following command to extract the list of LC hosts from your site level configuration file, to make them conveniently available as input to subsequent commands:

```shell script
simple extract-lc
```

## Generate ssh key for your cluster
To allow the LC hosts to be remotely installed and configured from the CM, a custom ssh key will be used by the framework. Generate it as follows:

```shell script
simple generate-key
```

Install the corresponding **public** ssh key on all your LC hosts, typically by **appending** it to the /root/.ssh/authorized_keys file.

## Check if ssh works for your cluster
The framework needs to be able to ssh from the CM to each of your LC hosts. Set it up as follows:

```shell script
simple test-ssh
```

For each LC host you typically will need to confirm its addition to the list of known hosts. Then **rerun** the command to check that it proceeds fine without further dialogues:

```shell script
simple test-ssh
```

## Pre-install the LC hosts
Now that ssh works from the CM to your LC hosts, the framework will be able to pre-install the latter:

```shell script
simple pre-install-lc
```

## Install the CM and the LC hosts
We now can initialize the SIMPLE framework by running its installer on the CM as well as the LC hosts:

```shell script
simple install
```

If you see any errors, please take a look at the troubleshooting section towards the end of 
this tutorial. As always, please feel free to [get in touch with us](../help) to help debug the error, if needed. 

**Note**: If you would like to ignore failures reported by the validation engine, please check the 
[FAQ](faq) section at the end of this guide
## Puppet certificate signing requests from LC hosts

On your CM node, you will now see the certificate signing requests from LC hosts using:
 
```shell script
puppet cert list -all
```

Sign the certificate requests as follows:

```shell script
puppet cert sign --all
```

**Note**: If you do not see any certificate signing requests, please check that Port 8140 is open on your CMs firewall 
and that the LCs can reach the CM over your network. Then try again.

## Some 'Good to Know' things

**Note**: You can skip this section and come back to it if needed. It contains some useful insights into the framework 
that are good to keep in mind when deploying your cluster.

### Execution Pipeline
The framework's execution pipeline consists of the following stages for the CM:
1. **install** : Install framework components
1. **config**: Configure framework components
1. **pre_deploy**: Prepare LCs for deploying the grid services
1. **deploy**: Deploy and Configure containerized grid services
1. **final**:  The final stage indicating that the grid services have been deployed.

For a LC node, the **pre_deploy** stage is broken down into 3 steps:
1. pre_deploy_step_1
1. pre_deploy_step_2
1. pre_deploy_step_3

And the **deploy** stage is broken down into 2 steps:
1. deploy_step_1
1. deploy_step_2

So far, we have completed the **install** and **config** stages for our CM and LC nodes. 
From now, we shall only interact with the CM node, which will execute and manage the stages appropriately for all the 
LC nodes. 

To check the stage of any of your CM or LC nodes, you can run the following command:
```shell script
puppet facts | grep simple_stage
```
On the CM, there is a convenient shorthand for that:
```
simple cm-stage
```

### Puppet Bolt
After the config stage, you can use Puppet Bolt on your CM to directly execute shell commands and scripts on some or 
all of your LCs. For the most important such commands, the **simple** CLI provides convenient wrappers.
Let's say we wish to check the stage for our LC hosts:
```shell script
simple lc-stage
```
That command is rather verbose, showing various underlying Bolt details. A more pleasant way to check the stages of the CM and all LC hosts in one go is as follows:
```shell script
simple check-stage stage-name
```
where 'stage-name' is the name of the expected stage, as detailed below. The command will print the outliers, i.e. those hosts that are **not** in the expected stage, along with their actual stages.

*Optional* : if you'd like to execute a command on all nodes in your cluster, you can do using bolt from now on. For instance,
the command below would return the hostname of all the LCs in your cluster:

```shell script
bolt command run 'hostname' -t @/etc/simple_grid/lc
```
### Execution Pipeline Traversal

#### Forward direction
The recipes here describe how to go from one stage to another in the execution pipeline.

| Current Stage | Next Stage                | Node Type | Command                 |
|---------------|---------------------------|-----------|-------------------------|
| install/config| pre_deploy                | CM        | ```simple install```    |
| pre_deploy    | deploy                    | CM        | ```simple pre-deploy``` |
| deploy        | final                     | CM        | ```simple deploy```     |
| install       | config/pre_deploy_step_1  | LC*       | ```simple install```    |

**Note***: The command sets the stage to *config* and puppet agent runs in the background to fetch some additional configuration from the CM. Once that is complete,
the stage is set to *pre_deploy_step_1*.

#### Reverse direction
Life's not perfect and despite our best efforts we may run into unexpected issues during the framework's execution.
In the past we have seen network errors or configuration errors which required us to rollback to previous_stages, fix the issues
and then proceed with the execution pipeline. The table below describes the rollback commands:

| Current Stage | Next Stage | Node Type | Command                             |
|---------------|------------|-----------|-------------------------------------|
| final         | deploy     | CM        | ```simple rollback-to deploy```     |
| final         | deploy     | CM*       | ```simple rollback-to deploy rmi``` |
| deploy        | pre_deploy | CM        | ```simple rollback-to pre-deploy``` |
| pre_deploy    | config     | CM        | ```simple rollback-to config```     |
| pre_deploy    | config     | LC**      | ```simple rollback-to config lc```  |

**Note** *: Removes HTCondor Docker images from all nodes.

**Note** **: You should almost never have to rollback the LCs to config stage.

## Execute the Framework
Now that we have a compilable site level configuration file and have initialized Puppet and the SIMPLE Framework on all
of the nodes, we can execute the framework to setup our HTCondor Cluster. 
1. On the CM node, let's ensure that all the machines are in pre_deploy stage. To do so, run the command below:
    ```shell script
    simple check-stage pre-deploy
    ```
    and observe the outliers field in the output. If the command **fails** altogether, see below for advice. If the outliers field is empty, that means all machines are in pre_deploy stage
    and we can proceed to the next step to execute the stage. The correct output looks as follows:
    ```shell script
        {
            "expected_stage": "pre_deploy",
            "outliers": [
    
            ]
        }
     ```
    Otherwise, the outliers field will list the FQDN and stage of the hosts that are not in the pre_deploy stage.
    For example:
    ```shell script
    {
         "expected_stage": "pre_deploy",
         "outliers": [
           {
             "fqdn": "localhost",
             "stage": "deploy"
           }
         ]
       }
    ```
    In that case, please rollback to pre_deploy stage:
    ```shell script
    simple rollback-to pre-deploy
    ```
    
    If the 'check-stage' command **fails** altogether, or the outliers represent any of the LC hosts, please verify that you have **signed the Puppet certificates** for all LC hosts.
    It also is possible that the underlying Bolt functionality was still being configured by Puppet in the background.
    In that case, please wait a bit and try again. You can also check /var/log/messages to see what Puppet is doing.
    ```shell script
    tail -f /var/log/messages
    ```
1.  On the CM node, to execute the pre_deploy stage of the framework, run:
    ```shell script
    simple pre-deploy
    ```
       
    Then check if all the nodes are now in the deploy stage:
    ```shell script
    simple check-stage deploy
    ```
    If the pre_deploy stage ran successfully, you will see an empty list of outliers in the output. 
    ```shell script
    {
        "expected_stage": "deploy",
        "outliers": [

        ]
    }
    ```
    Otherwise, the outliers field in the output 
    would include the FQDN and stage of all the hosts that are in the incorrect stage.
       
    If something fails, please rollback the CM to pre_deploy stage as shown above and try again.
    If it keeps failing, please get in touch for advice.
    

1. On the CM, execute the deploy stage:

    ```shell script
    simple deploy
    ```

As that command might take ~15 minutes per LC host, e.g. depending on network speed, the LC hosts will be done in the background if the CM deployment succeeded. In future releases, the deployment is expected to become much faster.

The component repositories are deployed in order of the **execution_ids** that correspond to their entries in the
site level configuration file. During the pre_deploy_step_1, the images for containers are fetched and then the 
containers are started. During pre_deploy_step_2, the grid services inside the containers get configured. 
Once all LC hosts have reached the final stage, deployment is considered to be completed.

At any time, you can check the stage of all of your LC nodes as follows:
```shell script
simple lc-stage
```

If the deployment was successful in the end, the CM and LC hosts should be in the final stage:
```shell script
simple check-stage final
```

**Note**: If the deployment fails, please take a look at the deployment logs and [share the logs](../help) with us, in case they do not make sense.
You can also try to **rollback** to the deploy stage, check if that worked and, if so, redo the deployment step.
Please get in touch if it keeps failing.

If everything went well, you now have a **production ready HTCondor cluster!**

## Inspecting the SIMPLE cluster

Let's go to our HTCondor-CE LC hosts. In the example cluster, it is simple-lc-node0.cern.ch.
To take a look at the running HTCondor-CE container, execute:
```shell script
docker ps -a
```

To get inside the HTCondorCE container, you can run:
```shell script
docker exec -it $(docker ps -aq) bash
```

Once you are in the container:
1. You can check if condor and condor-ce services are up.
    ```shell script
    systemctl status condor-ce
    systemctl status condor
    ```

2. You can take a look at the condor_pool, execute 
    ```shell script
    condor_status
    ```
 
3. You can take a look at the queue for the CE
    ```shell script
    condor_ce_q
    ```

[![asciicast](https://asciinema.org/a/296615.svg)](https://asciinema.org/a/296615)

## Troubleshooting
If you do not find what you are looking for in this troubleshooting section, please [get in touch](../help) with us and 
we will help fix your issue and update this guide.
### YAML compiler fails when running SIMPLE Installer on CM 
When you run the SIMPLE Installer on the CM and there are compilation errors, the SIMPLE installer would fail with 
an error like:
```javascript
Error: 'bash -c 'source /etc/simple_grid/yaml_compiler/.env/bin/activate && simple_grid_yaml_compiler /etc/simple_grid/site_config/site_level_config_file.yaml  -o /etc/simple_grid/site_config/augmented_site_level_config_file.yaml -s /etc/simple_grid/site_config/augmented_site_level_config_schema.yaml'' returned 1 instead of one of [0]
Error: /Stage[main]/Simple_grid::Components::Yaml_compiler::Execute/Exec[execute compiler]/returns: change from 'notrun' to ['0'] failed: 'bash -c 'source /etc/simple_grid/yaml_compiler/.env/bin/activate && simple_grid_yaml_compiler /etc/simple_grid/site_config/site_level_config_file.yaml  -o /etc/simple_grid/site_config/augmented_site_level_config_file.yaml -s /etc/simple_grid/site_config/augmented_site_level_config_schema.yaml'' returned 1 instead of one of [0]
```
Yes, we agree with you that this is a very 'developer' oriented message and not a 'user' oriented error message.
And yes, we are totally aware that the YAML compiler does not print the best error messages and that it can be 
daunting to figure out exactly what went wrong. We are working on simplifying this for you in our upcoming releases. 
In the meantime, please do not hesitate to [get in touch](../help) and we can help resolve any errors.

Below, we discuss some common errors that site admins have encountered in the past

#### Indentation Errors
YAML is indentation sensitive. Therefore, a consistent use of tabs or spaces throughout the document can help avoid 
potential indentation errors.

```javascript
Notice: /Stage[main]/Simple_grid::Components::Yaml_compiler::Execute/Exec[execute compiler]/returns: ruamel.yaml.parser.ParserError: while parsing a block mapping
Notice: /Stage[main]/Simple_grid::Components::Yaml_compiler::Execute/Exec[execute compiler]/returns:   in "./.temp/runtime.yaml", line 1, column 1
Notice: /Stage[main]/Simple_grid::Components::Yaml_compiler::Execute/Exec[execute compiler]/returns: expected <block end>, but found u'<block mapping start>'
Notice: /Stage[main]/Simple_grid::Components::Yaml_compiler::Execute/Exec[execute compiler]/returns:   in "./.temp/runtime.yaml", line 349, column 3
Error: 'bash -c 'source /etc/simple_grid/yaml_compiler/.env/bin/activate && simple_grid_yaml_compiler /etc/simple_grid/site_config/site_level_config_file.yaml  -o /etc/simple_grid/site_config/augmented_site_level_config_file.yaml -s /etc/simple_grid/site_config/augmented_site_level_config_schema.yaml'' returned 1 instead of one of [0]
Error: /Stage[main]/Simple_grid::Components::Yaml_compiler::Execute/Exec[execute compiler]/returns: change from 'notrun' to ['0'] failed: 'bash -c 'source /etc/simple_grid/yaml_compiler/.env/bin/activate && simple_grid_yaml_compiler /etc/simple_grid/site_config/site_level_config_file.yaml  -o /etc/simple_grid/site_config/augmented_site_level_config_file.yaml -s /etc/simple_grid/site_config/augmented_site_level_config_schema.yaml'' returned 1 instead of one of [0]
```
In the lines directly above the error message, you might see a reference to a particular line number in 
**./temp/runtime.yaml** and a message like: ```expected <block end>, but found u'<block mapping start>'```
 
This is an indication for potential indentation errors. To identify which line in your site_level_config_file.yaml is 
causing an indentation error in runtime.yaml, which is the output of one of the compiler's phases, we should inspect runtime.yaml

```shell script
vim /etc/simple_grid/yaml_compiler/.temp/runtime.yaml
```

Then go to the line number that was mentioned in the errors message, in this case it is **line 349**

```yaml
site:
   name: 'OpenStack SIMPLE dev cluster'
  email: 'admin@my-host.my-domain'
  latitude: 46.3
  longitude: 6.2
```

We notice that the name field in the site section has extra indentation than rest of the fields of the site section.
Aha! Now, we just go back to our site_level_config_file and can fix the indentation and continue.

#### Field/Variable not declared or declared multiple times
The second most common type of error we have come across is related to redeclaration of fields/variables or missing
fields/variables. These errors are easier to spot.
An example of missing field error is:
```javascript
tice: /Stage[main]/Simple_grid::Components::Yaml_compiler::Execute/Exec[execute compiler]/returns:     None, None, 'found undefined alias %r' % utf8(alias), event.start_mark
Notice: /Stage[main]/Simple_grid::Components::Yaml_compiler::Execute/Exec[execute compiler]/returns: ruamel.yaml.composer.ComposerError: found undefined alias 'lightweight_component04_fqdn'
Notice: /Stage[main]/Simple_grid::Components::Yaml_compiler::Execute/Exec[execute compiler]/returns:   in "./.temp/runtime.yaml", line 380, column 11
Error: 'bash -c 'source /etc/simple_grid/yaml_compiler/.env/bin/activate && simple_grid_yaml_compiler /etc/simple_grid/site_config/site_level_config_file.yaml  -o /etc/simple_grid/site_config/augmented_site_level_config_file.yaml -s /etc/simple_grid/site_config/augmented_site_level_config_schema.yaml'' returned 1 instead of one of [0]
Error: /Stage[main]/Simple_grid::Components::Yaml_compiler::Execute/Exec[execute compiler]/returns: change from 'notrun' to ['0'] failed: 'bash -c 'source /etc/simple_grid/yaml_compiler/.env/bin/activate && simple_grid_yaml_compiler /etc/simple_grid/site_config/site_level_config_file.yaml  -o /etc/simple_grid/site_config/augmented_site_level_config_file.yaml -s /etc/simple_grid/site_config/augmented_site_level_config_schema.yaml'' returned 1 instead of one of [0]
```
Right above the error, you will see a line indication the line and column number in ./.temp/runtime.yaml where the compiler failed.
Right above that line, you will also see a statement like ```found undefined alias 'lightweight_component04_fqdn'```.

In our example, this already tells us that we have not declared the lightweight_components04_fqdn variable in the site_level_config_file.

We could go to the line mentioned in the error message for the ./temp/runtime.yaml file to see where we are using this 
variable. In this case, it is in the site_infrastructure section.

Then, we would fix this error by adding the lightweight_component04_fqdn variable under the global_variables section of 
the site_level_configuration_file.


## Known Issues

Please report anything unexpected you've encountered by [reaching out to us](../help). We will update this section as we become aware of such cases.

## FAQs 

### How can I disable the CLI from exiting in case of validation errors?
By default, if there are errors reported by the validation engine, it will cause the framework's pipeline stage to not run.
You could still proceed with the installation, bearing in mind that things could go wrong in the configuration
depending on the nature of the validation errors.
To disable hard errors from the validation engine, you can open the simple cli script.
```shell script
vim ~/simple
``` 
And then uncomment the lines that after "Uncomment the lines below..":
```shell script
    # Uncomment the lines below to ignore validation engine errors
    # echo "For now just exit 0..."
    # exit 0

```
### Can I add new machines, for instance WNs, after deploying a SIMPLE cluster?
Yes, it is possible to add new LC hosts to your existing SIMPLE cluster. The instructions are about 10-15 steps per node
at present and we are working to release them as a single command in our upcoming releases. Please [contact us](../help)
to learn more about how to do this with the current versions of the puppet module. Please also refer to the following issue 
[issue_130](https://github.com/simple-framework/simple_grid_puppet_module/issues/130)



