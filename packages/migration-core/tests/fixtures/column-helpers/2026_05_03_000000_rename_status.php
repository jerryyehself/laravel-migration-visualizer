<?php
return new class extends Migration {
    function up() {
        Schema::table('profiles', function ($t) {
            $t->renameColumn('status', 'state');
        });
    }
};
