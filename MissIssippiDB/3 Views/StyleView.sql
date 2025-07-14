drop view if exists StyleView 
go

create view StyleView as (
select 
s.StyleNumber, 
s.[Description], 
pt.ProductTypeName,
s.CostPrice, 
s.WholesalePrice, 
s.Weight, 
se.SeasonName,
se.SeasonDateCreated,
SeasonActive = se.Active,
s.StyleDateCreated,
s.InProduction,
s.StyleId,
s.ProductTypeId, 
s.SeasonId
from Style s
join  ProductType pt 
on s.ProductTypeId = pt.ProductTypeId
join Season se 
on s.SeasonId = se.SeasonId
)

