<?php

namespace Database\Views;

use Database\Utils;
use Database\View;

class Notifications extends View
{
    public string $name = "Notifications";
    public string $select = "";
    public array $requires = [];

    public function __construct() {
        $this->select = "
SELECT N.*,
    CASE WHEN Sender.User_ID IS NOT NULL THEN JSON_OBJECT(
        " . Utils::GenerateJSONObject("Sender", Utils::GetCols("Merged_Users")) . "
    ) ELSE NULL END AS SenderData,

    CASE WHEN R_U.User_ID IS NOT NULL THEN JSON_OBJECT(
        " . Utils::GenerateJSONObject("R_U", Utils::GetCols("Merged_Users")) . "
    ) ELSE NULL END AS Ref_Users_Data,

    CASE WHEN R_M.Medal_ID IS NOT NULL THEN JSON_OBJECT(
        " . Utils::GenerateJSONObject("R_M", Utils::GetCols("Medals_Data")) . "
    ) ELSE NULL END AS Ref_Medals_Data,

    CASE WHEN R_S.ID IS NOT NULL THEN JSON_OBJECT(
        " . Utils::GenerateJSONObject("R_S", Utils::GetCols("Snapshots_Versions")) . "
    ) ELSE NULL END AS Ref_Snapshots_Data,

    CASE WHEN R_C.ID IS NOT NULL THEN JSON_OBJECT(
        " . Utils::GenerateJSONObject("R_C", Utils::GetCols("Common_Comments")) . "
    ) ELSE NULL END AS Ref_Comments_Data,

    CASE WHEN R_RC.ID IS NOT NULL THEN JSON_OBJECT(
        " . Utils::GenerateJSONObject("R_RC", Utils::GetCols("Common_Comments")) . "
    ) ELSE NULL END AS Ref_Comments_Reply_Data

FROM Notifications AS N
    LEFT JOIN Merged_Users AS Sender ON N.SenderID = Sender.User_ID
    LEFT JOIN Merged_Users AS R_U ON N.Ref_Users = R_U.User_ID
    LEFT JOIN Medals_Data AS R_M ON N.Ref_Medals = R_M.Medal_ID
    LEFT JOIN Snapshots_Versions AS R_S ON N.Ref_Snapshots = R_S.ID
    LEFT JOIN Common_Comments AS R_C ON N.Ref_Comments = R_C.ID
    LEFT JOIN Common_Comments AS R_RC ON N.Ref_Comments_Reply = R_RC.ID
ORDER BY N.Date DESC
";
        echo $this->select;
    }
}