# GovCentral Laptop // Workstation Re-Imaging

Typically, the Workstations and Laptops that we receive are outdated and need to be re-imaged with our latest Windows image. Here's a guide on how to get that done.

1. Get the machine setup with the power cable plugged in, but do not press the power button yet.
2. Insert the flash drive into the high speed port and boot the machine.
![Re-Image-1](../../../../overrides/assets/images/reimage-1.png#centered)
3. Mash the `F12` button to get into the Boot Menu.
4. Select the flash drive and boot from it. Click it or navigate to it with the arrow keys and then press `Enter`.
    1. In rare instances, the drive will not be detected in the high speed USB port so you will need to try another one.
![Re-Image-2](../../../../overrides/assets/images/reimage-2.png#centered)
5. It will boot the `Image Assist` software. Click the `Restore` button.
![Re-Image-3](../../../../overrides/assets/images/reimage-3.png#centered)
6. You will now see the `Restore Image` screen where you need to select the image you would like to use to restore the device. Click the `Browse` button.
![Re-Image-4](../../../../overrides/assets/images/reimage-4.png#centered)
7. The `Browse For File` window will open. Expand the `IA_DYNAMIC_DATA (V:\)` drive and click on the `Dell_Images` folder.
8. You will see two images that we have. One for Desktops (`DT`) and one for Laptops (`LT`). Select the corresponding image you need to use and click the `OK` button.
![Re-Image-5](../../../../overrides/assets/images/reimage-5.png#centered)
9. It will now take you back to the main `Image Assist` screen and you can click the `RESTORE DEVICE` button in the bottom, right-hand corner of the screen.
![Re-Image-6](../../../../overrides/assets/images/reimage-6.png#centered)
10. Once it is complete it will display a pop-up stating `Restore Process Complete`.
    1. You can click `REBOOT` and then remove the flash drive if you're ready to keep working on the machine.
    2. You can click `SHUTDOWN` if you're done working on the machine for now or if you want to move it before continuing.
![Re-Image-7](../../../../overrides/assets/images/reimage-7.png#centered)