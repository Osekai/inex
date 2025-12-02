export function PermissionChecker(permission, dflt = false, _permissions = null) {
    if(!loggedIn) return dflt;
    if(_permissions == null) _permissions = userData.Permissions;
    if(_permissions == null) return dflt;
    const parts = permission.split(".");

    for (var x = 0; x < _permissions.length; x++) {
        var split = _permissions[x].split(".");
        for (var y = 0; y < split.length; y++) {
            if (split[y] === "*" && y <= parts.length - 1) return true
            if (split[y] !== parts[y]) break;
            if (split[y] === parts[y] && y === parts.length - 1) return true
        }
    }
    return false;
}