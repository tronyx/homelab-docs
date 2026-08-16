# Globalscape Deployments

## Advanced Workflow Event & Event Rules Deployment

1. Open the Ticket and assign it to yourself if the DMS scanning team or someone else does not send one.
2. In the ticket will be the GitLab link. Open that to obtain the AML and JSON files needed to be imported.
![Globalscape-1](../../overrides/assets/images/globalscape-1.png#center)
![Globalscape-2](../../overrides/assets/images/globalscape-2.png#center)
3. Once GitLab is opened, download the **AML file** (advanced workflow event aka AWE) and any **JSON files** (event rules) requested to your local machine.
4. Copy them over to the **Globalscape server**, `USNUSGMEFTAP01`, to a directory you’ll remember such as your Desktop or Downloads directory.
5. Once copied, open Globalscape and click on **Advanced workflows**.
![Globalscape-3](../../overrides/assets/images/globalscape-3.png#center)
6. To the right, select **import** and then find the AML file you copied over previously.
![Globalscape-4](../../overrides/assets/images/globalscape-4.png#center)
![Globalscape-5](../../overrides/assets/images/globalscape-5.png#center)
7. Click open then put your name, date (yearmonthday) and the ticket number in the Description field.
![Globalscape-6](../../overrides/assets/images/globalscape-6.png#center)
8. Import the AML, then verify it appears in the list.
![Globalscape-7](../../overrides/assets/images/globalscape-7.png#center)
9. **Uncheck** “terminate the process if still running after 120 minutes.
10. Change Debug log to **none** and click **apply**.
![Globalscape-8](../../overrides/assets/images/globalscape-8.png#center)
11. Now right click on **Event Rules** then **import**.
![Globalscape-9](../../overrides/assets/images/globalscape-9.png#center)
![Globalscape-10](../../overrides/assets/images/globalscape-10.png#center)
12. Find the **JSON** file(s) you need to import then select open to add them.
![Globalscape-11](../../overrides/assets/images/globalscape-11.png#center)
13. Verify its now showing in the event rules list.
![Globalscape-12](../../overrides/assets/images/globalscape-12.png#center)
14. At this time the requestor probably will want them **disabled** until the previous used event rule can be disabled. If so, you right-click the event rule then select disable if it's not already. Do the same for the old event rule they want to disable.
![Globalscape-13](../../overrides/assets/images/globalscape-13.png#center)
15. IF its disabled, itll indicate so by a red x as shown below.
![Globalscape-14](../../overrides/assets/images/globalscape-14.png#center)
16. nce the Event Rule(s) have been added, we’ll need to update the AWE it uses to the current to the one we previously imported.
17. Select the **Event rule** and on the right pane, look for **Execute <AWE name>**.
![Globalscape-15](../../overrides/assets/images/globalscape-15.png#center)
18. Click on it then select the AWE you need from the top drop down.
![Globalscape-16](../../overrides/assets/images/globalscape-16.png#center)
19. Once selected, click **OK** then **Apply**.
![Globalscape-17](../../overrides/assets/images/globalscape-17.png#center)
20. You may be asked to run the event rule to test it. IF so, select the Event Rule and enable it, then choose run now.
![Globalscape-18](../../overrides/assets/images/globalscape-18.png#center)
21. Note: there will be no x on the event rule once its enabled
![Globalscape-19](../../overrides/assets/images/globalscape-19.png#center)
22. The deployment should be completed and you can now remove the copies of the AML and JSON files you have saved.
23. **Note:** There may be additional steps but the requestor will indicate what and oftentimes this process will be conducted on a video call where you will screen share with them.