drop view if exists InventoryView
go

create view InventoryView as (
select 
s.StyleNumber,
s.[Description],
c.ColorName,
si.SizeName,
i.Qty,
se.SeasonName,
i.InStock,
i.InventoryId, 
i.StyleColorId,
s.StyleId,
c.ColorId,
i.SizeId,
se.SeasonId
from Inventory i
join StyleColor sc 
on i.StyleColorId = sc.StyleColorId
join Style s 
on sc.StyleId = s.StyleId
join Season se 
on se.SeasonId = s.SeasonId
join Color c 
on sc.ColorId = c.ColorId
join Sizes si 
on i.SizeId = si.SizeId)
