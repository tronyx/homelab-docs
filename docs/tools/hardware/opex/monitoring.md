# Monitoring

All monitoring\batch fixing will happen from the `“CertainScan Monitor”` program on the `“Transformation VM”`. It works similarly to the `“Admin”` console used by IBML, but with limited capacity.


## Initial

1. Please take the file listed [HERE](https://drive.google.com/file/d/1aNsngzZJSGly4gk5d0Jcyt-JdCicK_PZ/view?usp=share_link) and place it within the folder listed below. This establishes the layout of the monitor in a uniform way for each user on that vm.

![Opex-Monitoring-1](../../../overrides/assets/images/opex-monitoring-1.png#center)


## Info

1. When a scanning operator goes to `“Close”` or `“Suspend”` a Batch they are given 3 options on the machine, `“Send to Edit”`, `“Send to Transform”`, and `“Suspend”`. Based on which one they click will determine where you will see it within the monitor.
    1. Resume Scanning:
![Opex-Monitoring-2](../../../overrides/assets/images/opex-monitoring-2.png#center)
    2. Sent to Editing:
![Opex-Monitoring-3](../../../overrides/assets/images/opex-monitoring-3.png#center)
    3. Waiting to be Transformed:
![Opex-Monitoring-4](../../../overrides/assets/images/opex-monitoring-4.png#center)
2. Temporary storage of images and other files related to specific batches can be found below. This is required if you need to manually browse to the location to open up a batch.
![Opex-Monitoring-5](../../../overrides/assets/images/opex-monitoring-5.png#center)


## Errors

Below is a list of common errors that we have come across.

!!! note

    Please be aware this is after full testing and deployment into production. Anytime any changes are made to the jobs then other issues or errors may arise that will need to be consulted with OPEX to correct.

1. Operator sends batch to `“Edit”` instead of `“Transform”` or `“Suspend”`.
    1. In this case the operator will need to open up `“CertainScan Edit”` (shortcut is on their desktop) and open the Batch in edit and `“Close”` it like they would through scan and send it to the correct queue.
![Opex-Monitoring-6](../../../overrides/assets/images/opex-monitoring-6.png#center)
    2. If they are unable to see the Batch within the `“Edit”` program, they will need to use the `“Open”` function and manually navigate to the `“C:\CTERA\OPEX\Batch_CS_Temp”` folder, go inside the folder with their Batch name, and open the `.oii` file from inside that folder.
![Opex-Monitoring-7](../../../overrides/assets/images/opex-monitoring-7.png#center)

!!! note

    Edit is accessible from Transformation VM as well.

2. Batch goes to “Error” during transformation.
    1. If that happens you will see the Batch in `“Batches Needing Cleanup from CertainScan Transform”` queue as well as an exclamation mark by the `“Batch Queues”` button on the left.
![Opex-Monitoring-8](../../../overrides/assets/images/opex-monitoring-8.png#center)
![Opex-Monitoring-9](../../../overrides/assets/images/opex-monitoring-9.png#center)
    2. The “Error” message will be on the far right of the column within that window. Correct the error and then right click the batch and select “Restart Transform” to have it try again. Repeated errors or unknown error description please reach out to us or OPEX for assistance.
![Opex-Monitoring-10](../../../overrides/assets/images/opex-monitoring-10.png#center)
![Opex-Monitoring-11](../../../overrides/assets/images/opex-monitoring-11.png#center)


## As-Needed

1. Restart the `"Transformation"` Service in Windows Services:
![Opex-Monitoring-12](../../../overrides/assets/images/opex-monitoring-12.png#center)
2. After the Batch is in the “Batches Transformed” window that means OPEX has output all the files in the desired directories and are ready to be imported into Kofax. If an issues arises when a batch has completed then the only option from there is to check the importer program or have operations rescan the batch.
