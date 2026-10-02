<?php
return new class extends Migration {
    function up() {
        Schema::table('profiles', function ($t) {
            $t->dropRememberToken();
            $t->dropSoftDeletesTz('missing');
        });
    }
};
