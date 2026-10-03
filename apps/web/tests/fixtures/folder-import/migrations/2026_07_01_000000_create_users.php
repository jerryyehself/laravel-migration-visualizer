<?php
return new class extends Migration {
    function up() {
        Schema::create('users', function ($t) {
            $t->id();
            $t->string('name');
        });
    }
};
