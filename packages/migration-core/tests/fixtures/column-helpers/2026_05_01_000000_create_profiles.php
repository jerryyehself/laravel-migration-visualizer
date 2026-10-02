<?php
return new class extends Migration {
    function up() {
        Schema::create('profiles', function ($t) {
            $t->enum('status', ['', 'active', 'paused'])->default('');
            $t->rememberToken();
            $t->softDeletesTz('archived_at', 3);
            $t->timestampsTz(6);
        });
    }
};
