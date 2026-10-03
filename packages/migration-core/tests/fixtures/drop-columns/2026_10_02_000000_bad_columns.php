<?php
return new class extends Migration {
    function up() {
        Schema::table('users', function($t) {
            $t->dropColumn(['a','missing']);
        });
    }
};
