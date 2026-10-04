<?php
return new class extends Migration {
    function up(): void {
        Schema::create('users', function($t) {
            $t->id(); $t->string('email')->unique();
        });
    }
};
