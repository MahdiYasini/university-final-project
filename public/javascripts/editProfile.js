$( document ).ready(function() {
    $("#changePasswordInput").hide();
    $("#country").hide();
    $("#changePassword").click(() => {
        $('#changePasswordDiv').hide("slow");
        $("#changePasswordInput").show("slow");
        
    })
});