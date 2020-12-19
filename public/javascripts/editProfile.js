$( document ).ready(function() {
    $("#changePasswordInput").hide();
    $("#country").hide();
    console.log( "ready!" );
    $("#changePassword").click(() => {
        $('#changePasswordDiv').hide("slow");
        $("#changePasswordInput").show("slow");
        
    })
});