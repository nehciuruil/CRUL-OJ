function formatTime(timestamp) {
    const date = new Date(parseInt(timestamp));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}
function renderResult(resultObj) {
    const container = document.getElementById('result_container');
    const backLink = document.getElementById('back_link');
    if (resultObj.id) {
        backLink.href = `problem?id=${resultObj.id}`;
    }
    if (!resultObj.verdict || !Array.isArray(resultObj.verdict)) {
        container.innerHTML = '<p>No test results available</p>';
        return;
    }
    let tableHTML = `
        <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th>Case</th>
                    <th>Status</th>
                    <th>Details</th>
                    <th>Point</th>
                    <th>Info</th>
                </tr>
            </thead>
            <tbody>
    `;
    resultObj.verdict.forEach(test => {
        tableHTML += `
            <tr>
                <td>${test.case || ''}</td>
                <td>${test.status || ''}</td>
                <td>${test.details || ''}</td>
                <td>${test.point || ''}</td>
                <td>${test.info || ''}</td>
            </tr>
        `;
    });
    tableHTML += `
            </tbody>
        </table>
    `;
    container.innerHTML = "<h3>" + resultObj.brief + "</h3>";
    container.innerHTML += tableHTML;
}
function setCodeDisplay(code) {
    const codeDisplay = document.getElementById('code_display');
    codeDisplay.textContent = code || 'No code available';
}
async function process() {
    const supabase = getClient();
    const submissionId = parseInt(getArgs('id'));
    const title = document.getElementById('title');
    const submitTime = document.getElementById('submit_time');
    const backLink = document.getElementById('back_link');
    const container = document.getElementById('result_container');
    if (!submissionId) {
        title.textContent = 'No submission ID provided';
        return;
    }
    title.textContent = 'Submission Result #' + submissionId;
    submitTime.textContent = `Submit Time: ${formatTime(submissionId)}`;
    const { data: resultData, error: resultError } = await supabase
        .from('results')
        .select('*')
        .eq('id', submissionId)
        .single();
    if (resultData) {
        try {
            const resultObj = JSON.parse(resultData.result);
            setCodeDisplay(resultObj.code);
            renderResult(resultObj);
        } catch (e) {
            container.innerHTML = '<p>Error parsing result data</p>';
        }
        return;
    }
    const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();
    
    if (!submissionData) {
        title.textContent = 'No such submission';
        container.innerHTML = '<p>Redirecting back in 3 seconds...</p>';
        setTimeout(() => {
            window.history.back();
        }, 30000);
        return;
    }
    container.innerHTML = 'Pending for tests';
    try {
        const submissionInfo = JSON.parse(submissionData.info);
        setCodeDisplay(submissionInfo.code);
        if (submissionInfo.problem) {
            backLink.href = `/problem?id=${submissionInfo.problem}`;
        }
        const pollInterval = setInterval(async () => {
            const { data: resultData, error } = await supabase
                .from('results')
                .select('*')
                .eq('id', submissionId)
                .single();
            
            if (resultData) {
                try {
                    const resultObj = JSON.parse(resultData.result);
                    setCodeDisplay(resultObj.code);
                    renderResult(resultObj);
                    clearInterval(pollInterval);
                } catch (e) {
                    container.innerHTML = '<p>Error parsing result data</p>';
                    clearInterval(pollInterval);
                }
            }
        }, 3000);
    } catch (e) {
        container.innerHTML = '<p>Error parsing submission data</p>';
    }
}
process();
