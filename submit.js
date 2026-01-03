function render() {
    const problemIdInput = document.getElementById('problem_id');
    const backLink = document.getElementById('back_link');
    const submitBtn = document.getElementById('submit_btn');
    const codeText = document.getElementById('code_text');
    const id = getArgs('id');
    if (id) {
        problemIdInput.value = id;
        backLink.href = `problem?id=${id}`;
    } else {
        backLink.href = 'problem';
    }
    submitBtn.addEventListener('click', async function() {
        const problemId = problemIdInput.value.trim();
        const code = codeText.value.trim();
        if (!problemId) {
            alert('Please enter Problem ID');
            return;
        }
        if (!code) {
            alert('Code is empty');
            return;
        }
        try {
            const supabase = getClient();
            const submissionId = Date.now();
            const submissionData = {
                problem: problemId,
                code: code,
            };
            const { data, error } = await supabase
                .from('submissions')
                .insert([
                    { 
                        id: submissionId, 
                        status: 'pending',
                        info: JSON.stringify(submissionData)
                    }
                ]);
            if (error) {
                alert('Submission failed: ' + error.message);
            } else {
                location.href = "result?id=" + submissionId;
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
}
render();
