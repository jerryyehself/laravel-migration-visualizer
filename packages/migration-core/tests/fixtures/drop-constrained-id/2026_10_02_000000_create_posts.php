<?php
return new class extends Migration {
    function up() {
        Schema::create('posts', function($t) {
            $t->string('keep'); $t->foreignId('user_id')->constrained();
        });
    }
};
