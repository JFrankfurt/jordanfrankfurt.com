---
title: Starting Sima
date: 2020-06-06T19:14:16+00:00
---

The idea for Sima came from a few coinciding circumstances:

Lauren and I had just gotten married, and she had about $55k in student loans. >$20k of that was at 11.75% We were both working reliable jobs with decent salaries. I had gotten my first credit card about three years prior, so I had a (short) credit history. In spite of this, no one would refinance the 11% loan for us. It blew my mind that people like us who were clearly safe borrowers couldn't access credit at all. It wasn't that people would lend to us, but only at bad rates; no one would lend to us in any amount at any price.

After college we were starting to build a social circle that included close friends who were further along in their lives and had been saving for a decade or more. I had the thought "If I knew there were an easy way to refi my friend's 11% loan and I had the money, I'd do it." But at that point I didn't know of any way to make it happen without it being pretty socially uncomfortable. 

A year or so later I had a good friend and coworker who is Indian and had gotten his masters degree in the US. He had more student debt than we did, and his was at about 17%. He was having the same experience I did trying to refinance our loans, though I imagine his citizenship made accessing credit in the US essentially impossible.

I was blown away by that. *Surely* there had to be an easy way for me to pay off a small piece of his loans and cut his rate in half. I trusted my friend would pay me back and never have trouble finding work, and of course I'd love to get an 8% yield on an investment. Again, I looked for an easy way to manage funding/repaying loans between friends, and I couldn't find anything that I liked. 

So I started building. I figured all we really needed was an ACH api to set up auto-pay, and basically, that's what we are today.

The basic flow for Sima:

1. Connect you bank
1. Add your friend as a connection
1. Offer your friend a loan at terms you both like
1. They review the offer (accept/decline)
1. The loan amount changes hands
1. ACH repayment executes according to your agreement. (We even have IO/deferral available!)

My use-case here, given my social situation, is based on friendships. But I have a feeling that the bigger opportunity is within families. Generational wealth differences are, obviously, huge. When a student goes through college they are immediately massively indebted (average >$30k) and the compensation the command for their skills/experience is essentially the lowest it will ever be. At the same time, many have a family network that is in their peak earning period. The students' relatives are either making more money than they ever have, or are transitioning from a growth to a wealth-preservation portfolio where fixed income is more attractive than it ever has been before. In fact, the older generation's FI portfolio is likely heavily weighted in diversified ABS instruments that are the ultimate buyer of student loan debt. It seems intuitive to me that there is more yield to be made for and a non-0 emotional value to be accrued to the older generation by funding the younger generation's education and early career endeavors.

The limiting factor in these situations is social risk. A lender doesn't want to fund a loan and end up having to hound their niece for missed payments over thanksgiving dinner. Sima aims to solve that w/ autopay, clear notifications, and a shared record of the state of the loan. Ideally you can just set it and forget it, which solves the social cost of servicing loans traditionally.  
