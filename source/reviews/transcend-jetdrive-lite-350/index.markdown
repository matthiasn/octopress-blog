---
layout: page
title: "Extending drive space by 128GB: Transcend Jetdrive lite 350"
date: 2014-09-23 15:35
comments: true
sharing: true
footer: true
---
Overall, I am really happy with my **2012 Retina MacBook**. The only real issue is that even the 512GB solid state disk is too small. I constantly run into a full drive. Now I could buy the latest version with 1TB, but apart from the bigger drive, I am not too impressed with the improvements over the one that I already have, so I'd rather wait. 

Sure, I could also connect an external drive via **USB 3.0**, but that's pretty annoying when on the move. If only there was a way to add additional internal storage. Well actually, there is a way. At first I thought about buying one of these **Nifty MiniDrives** with a large enough MicroSD card:

<iframe style="width:120px;height:240px;" marginwidth="0" marginheight="0" scrolling="no" frameborder="0" src="http://r.matthiasnehlsen.com/nifty/iframe">
</iframe>

<iframe style="width:120px;height:240px;" marginwidth="0" marginheight="0" scrolling="no" frameborder="0" src="http://r.matthiasnehlsen.com/microsd/iframe">
</iframe>

But there are some issues with that.

* **MicroSD** cards are way **slower** than regular SD cards
* **MicroSD** card are much **more expensive** than regular SD cards
* An adapter plus a card means one more set of electrical contacts than strictly necessary. I would like to avoid that. 

Regular, full-sized SD cards are not really an option either. While the laptop with inserted and protruding SD card still fits into the laptop sleeve, I am worried that a strong impact on the side of the sleeve will damage the slot or even something inside the MacBook. So what to do?

I found a somewhat shorter but otherwise regular SD card from Transcend that only protrudes about 1mm, with a rim that protects the SD card slot from forces that could push the SD card further inside. Here's how it looks like:

<iframe style="width:120px;height:240px;" marginwidth="0" marginheight="0" scrolling="no" frameborder="0" src="http://r.matthiasnehlsen.com/jetdrive/iframe">
</iframe>

With the card, I was able to alleviate the imminent shortage of disk space on my MacBook pro. Sure, it is much slower than the internal storage, but for photos or the iTunes library, for example, this works just fine. You probably want to format the drive first using the **Mac OS extended** format in the **[Disk Utility](http://en.wikipedia.org/wiki/Disk_Utility)**. After doing this, I moved my 90GB iTunes library onto the drive and pointed to that new location by creating a **[symbolic link](http://en.wikipedia.org/wiki/Symbolic_link)**. Then, I moved some 20GB of images onto the drive. Et voilà, I had over a hundred GB of extra drive space on my Mac again.

There is really only one issue I noticed: regular standby / sleep is fine - after waking up, the drive is still mounted. It's not so fine when the system shuts down at 0% battery capacity. In that case, after waking up, the drive is not mounted any longer. Then, you will either need to remove the card and plug it back in or restart the laptop. Pulling it out and plugging it back in is a little tricky though. I assume **[safe sleep](http://en.wikipedia.org/wiki/Sleep_(OS_X\))** is to blame here. When going into safe sleep, the entire content of the memory is saved to disk when the battery capacity is too low to maintain regular standby and then the system is shut down completely.

That's not the biggest issue for me, really. I try to avoid safe sleep anyway because I find it annoying how long it takes to wake the system up again. Not a surprise, really, when you consider that potentially all 16GB of RAM need to be rehydrated from SSD, but still.

## Conclusion
Overall, I am happy with my purchase and I can recommend the Jetdrive to you. It allows me to use my MacBook for a little longer without constantly having to free disk space. I only wish there were higher-capacity options available. But who knows, we may one day be able to buy a **256GB version**.