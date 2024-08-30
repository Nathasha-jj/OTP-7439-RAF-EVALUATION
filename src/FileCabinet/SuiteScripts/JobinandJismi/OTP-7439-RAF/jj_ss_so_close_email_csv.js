/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/email', 'N/file', 'N/record', 'N/search'],
    /**
 * @param{email} email
 * @param{file} file
 * @param{record} record
 * @param{search} search
 */
    (email, file, record, search) => 
    {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => 
        {

        }

        return {execute}

    });
