export function CommaSeparatedRolesToRoleArray(comma) {
    console.log(comma);
    var list = comma.toString().split(",");

    var resp = [];
    for(var item of list) {
        for(var role of roles) {
            if(role.ID == item) resp.push(role);
        }
    }
    return resp;
}