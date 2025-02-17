const ErrorTracker = {
    track: function(error, context) {
        if (!chrome.runtime.getManifest().version.includes('dev')) {
            const errorData = {
                timestamp: new Date().toISOString(),
                context: context,
                message: error.message || 'Unknown error',
                version: chrome.runtime.getManifest().version
            };

            chrome.storage.local.get(['errorLogs'], (result) => {
                const logs = result.errorLogs || [];
                logs.push(errorData);
                if (logs.length > 50) logs.shift();
                chrome.storage.local.set({ errorLogs: logs });
            });
        }
    },

    export: function() {
        chrome.storage.local.get(['errorLogs'], (result) => {
            const logs = result.errorLogs || [];
            if (logs.length === 0) return;

            const content = JSON.stringify(logs, null, 2);
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `highlighter-logs-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    },

    clear: function() {
        chrome.storage.local.set({ errorLogs: [] });
    }
};