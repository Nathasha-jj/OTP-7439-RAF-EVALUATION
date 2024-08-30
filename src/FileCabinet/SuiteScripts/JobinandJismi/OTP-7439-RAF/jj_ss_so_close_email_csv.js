/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
/*
 * Jobin and Jismi IT Services LLP
 *
 * ${OTP-7439} : ${RAF Evaluation}
 *
 *
 * Author: Jobin & Jismi IT Services LLP
 *
 * Date Created : 30-August-2024
 *
 * Description :This script is used to close the sales orders created 
 * on or before thirty days and are in pending fulfillment status,
 * and to generate and send CSV file for recording the details of these sales orders.
 * 
 * REVISION HISTORY
 *
 * @version 1.0 OTP-7439 : 30-August-2024 
 */
define(['N/email', 'N/file', 'N/record', 'N/search','N/runtime'],
    /**
 * @param{email} email
 * @param{file} file
 * @param{record} record
 * @param{search} search
 * @param{runtime} runtime
 */
    (email, file, record, search, runtime) => 
    {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => 
        {
            try
            {
                let objSearch = search.create(
                {
                    type: search.Type.SALES_ORDER,
                    filters: [['status','anyof','SalesOrd:B'], 'AND', ['trandate', 'onorbefore', 'thirtydaysago'],'AND',['mainline','is','T']],
                    columns: ['internalid','entity','tranid','amount']
                });
                let searchResultSet = objSearch.run();
                let csvContent = 'Sales Order ID,Document Number,Customer Name,Total Amount\n';
                let isSoClosed;
                searchResultSet.each(function(searchResult)
                {
                    let salesOrderId = searchResult.id;
                    log.debug("SO internal Id", salesOrderId);
                    let salesOrderRecord = record.load(
                    {
                        type: record.Type.SALES_ORDER,
                        id: salesOrderId
                    });
                    let statusSo = salesOrderRecord.getValue('orderstatus');
                    log.debug("SO Status", statusSo);
                    // salesOrderRecord.setValue({fieldId:'orderstatus', value: 'H'});
                    let lineCount = salesOrderRecord.getLineCount({sublistId: 'item'});
                    log.debug("Line Count", lineCount);
                    for( let i = 0;i < lineCount; i++)
                    {
                        let isClosed = salesOrderRecord.getSublistValue({sublistId:'item', fieldId:'isclosed',line: i});
                        log.debug("isClosed Value", isClosed);
                        if(!isClosed)
                        {
                            salesOrderRecord.setSublistValue({sublistId:'item', fieldId:'isclosed', line: i, value: true});
                        }
                    }
                    salesOrderRecord.save();
                    isSoClosed = true;
                    log.debug("Sales Order Closed");
                    let customerName = searchResult.getText('entity');
                    log.debug("Customer Name", customerName);
                    let documentNumber = searchResult.getValue('tranid');
                    log.debug("Document Number", documentNumber);
                    let totalAmount = searchResult.getValue('amount');
                    log.debug("Total Amount", totalAmount);
                    csvContent += salesOrderId + ',' + documentNumber+ ',' + customerName + ',' + totalAmount + '\n'
                    return true;
                });
                log.debug("CSV",csvContent);
                let today = new Date();
                let todaysDate = today.getMonth()+1 +"/"+ today.getDate() + "/"+today.getFullYear();
                let fileName = 'Closed sales Orders_'+todaysDate;
                log.debug("File Name", fileName);
                let csvFile = file.create(
                {
                    name: fileName,
                    fileType: file.Type.CSV,
                    contents: csvContent,
                    folder: 28,
                });
                let csvFileId = csvFile.save();
                log.debug("CSV File Id", csvFileId);
                let soClosedCsvFile = file.load(
                {
                    id: csvFileId 
                });
                log.debug("Is So Closed", isSoClosed);
                let recipientEmail = "nathasha.vangana@jobinandjismi.com";
                if(isSoClosed)
                {
                    email.send(
                    {
                        author: -5,
                        recipients: 1659,
                        subject: "Closed Sales Orders List "+ todaysDate,
                        body: "The sales orders which are created on or before thirty days are closed and the details are provided in the attachemnt",
                        attachments: [soClosedCsvFile]
                    });
                }
            }
            catch(e)
            {
                log.error("Error",e.message);
            }
            let scriptObj = runtime.getCurrentScript();
            log.debug("Script", scriptObj);
            let unitsRemaining = scriptObj.getRemainingUsage();
            log.debug("Usage Limit", unitsRemaining);
        }
        return {execute}

    });
