---
title: setting up a home server
date: 2021-01-01T16:25:00-05:00
---

For a long time I've wanted to do a learn linux better than the unix generic stuff you pick up from doing devwork on macos. I've also had an aspirational hope to run a home server that operates as a general utility for running services I happen to build and doing "philanthropic" donations to decentralized software networks/protocols I support.

About a month ago I finally took the leap and got started. (Thanks to Greg Taschuk and Nicholas Bourikas for the inspiration to finally go for it.) I've got an old laptop I used in college running Arch next to our router now. In fact, I'm writing this post with vim ssh'd into the thing from my couch.

So far I've absolutely loved it. It feels like the learning:effort ratio is just insanely high. Every time I want to figure out how to accomplish anything, the knowledge for how to accomplish it is readily available at any degree of depth. I've learned so much about linux in the past month. My first task was getting the Arch install completed. That was probably the most challenging thing to accomplish. A lot of the steps involved had to do with physical aspects of the computer that I've not worked with in the past.

Since then things have slowly gotten more familiar both due to my general work experience and due to my continued learning. I've figured out how to mount external drives, edited my logind.conf, set up an ssh server, installed gcc, go, python, node, and this evening I got geth running.

I have a LOT more I want to accomplish, and tbh it's a little overwhelming to think of all the things I want to learn at once.

I want to figure out my router configuration and port opening such that I can access the server from outside our network. I want to get IPFS and bitcoind running smoothly, with the ipfs api server resolving assets that are requested by other computers on the network. I want to get familiar enough with systemd services that I can confidently use them to their fullest extent in managing one-off cron-like jobs, and potentially get some automated crypto bots up and running using data from the nodes on the system.

I'm having a blast.
