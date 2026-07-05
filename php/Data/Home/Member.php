<?php

namespace Data\Home;



class Member
{
    public $name;
    public $role;
    public $links = [];
    public $active = true;
    public $otherNames = [];
    public $pastRole;

    public function __construct($osuId, $name, $role)
    {
        $this->osuId = $osuId;
        $this->name = $name;
        $this->role = $role;

        $this->AddLink("osu!", "https://osu.ppy.sh/u/" . $this->osuId);
    }

    public function AddLink($name, $url)
    {
        $this->links[] = ["name" => $name, "url" => $url];
        return $this;
    }
    public function AddLinks($links) {
        $this->links = array_merge($this->links, $links);
        return $this;
    }

    public function SetActive($active)
    {
        $this->active = $active;
        return $this;
    }

    public function SetOtherNames($names) {
        $this->otherNames = $names;
        return $this;
    }
    public function SetPastRole($role) {
        $this->pastRole = $role;
        return $this;
    }

    public function Panel() {
        ?>
        <div class="member-card <?php echo $this->active ? "" : "inactive" ?>">
            <div class="header">
                <img src="https://a.ppy.sh/<?= $this->osuId ?>">
            </div>
            <div class="top">
                <img src="https://a.ppy.sh/<?= $this->osuId ?>">
                <h1><?= $this->name ?></h1>
                <?php
                if ($this->otherNames) {
                    echo "<p>";
                    echo "also known as ";
                    echo implode(", ", $this->otherNames);
                    echo "</p>";
                }
                if(!$this->active) {
                    echo "<p class='inactive-text'>Alumni</p>";
                }
                ?>
            </div>
            <div class="middle">
                <h3 class="role"><?= $this->role ?></h3>
                <?php
                if ($this->pastRole) {
                    echo "<p class='past-role'>Previously: " . $this->pastRole . "</p>";
                }
                ?>
            </div>
            <div class="links">
                <?php
                foreach ($this->links as $link) {
                    echo "<a href='" . $link["url"] . "'>" . $link["name"] . "</a>";
                }
                ?>
            </div>
        </div>

        <?php
    }

}