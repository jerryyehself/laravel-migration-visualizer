<?php return new class extends Migration { function up() { Schema::table('tags', function($t) { $t->numericMorphs('taggable'); $t->dropColumn('missing'); }); } };
