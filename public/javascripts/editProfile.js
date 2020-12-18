console.log("Check");
$( document ).ready(function() {
    $("#changePasswordInput").hide();
    $("#country").hide();
    console.log( "ready!" );
    $("#changePassword").click(() => {
        console.log("clicked");
        $('#changePasswordDiv').hide("slow");
        $("#changePasswordInput").show("slow");
        
    })
});