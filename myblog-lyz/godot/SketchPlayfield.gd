extends Node2D

@export var playfield_size: Vector2 = Vector2(840, 420)
@export var cell_size: float = 38.0
@export var fill_color: Color = Color(0.95, 0.95, 0.95, 1.0)
@export var grid_color: Color = Color(0.74, 0.74, 0.74, 1.0)
@export var border_color: Color = Color(0.05, 0.05, 0.05, 1.0)
@export var grid_width: float = 1.2
@export var border_width: float = 7.0

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, playfield_size), fill_color, true)

	var x := cell_size
	while x < playfield_size.x:
		draw_line(Vector2(x, 0.0), Vector2(x, playfield_size.y), grid_color, grid_width)
		x += cell_size

	var y := cell_size
	while y < playfield_size.y:
		draw_line(Vector2(0.0, y), Vector2(playfield_size.x, y), grid_color, grid_width)
		y += cell_size

	var corners := PackedVector2Array([
		Vector2.ZERO,
		Vector2(playfield_size.x, 0.0),
		playfield_size,
		Vector2(0.0, playfield_size.y),
		Vector2.ZERO
	])
	draw_polyline(corners, border_color, border_width)
