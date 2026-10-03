<?php return new class extends Migration { function up() { Schema::table('tags', function($t) { $t->dropMorphs('n'); $t->dropMorphs('u','custom'); }); } };
